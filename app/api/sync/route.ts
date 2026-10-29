import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MasteryStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface SyncAttemptPayload {
  exerciseId: string;
  isCorrect: boolean;
  chosenAnswer: string;
  hintsUsedCount: number;
  timeSpentSeconds: number;
  offlineTimestamp: string;
}

interface SyncRequestPayload {
  childId: string;
  batchId: string;
  deviceId: string;
  clientAppVersion?: string;
  attempts: SyncAttemptPayload[];
}

export async function POST(req: NextRequest) {
  try {
    const body: SyncRequestPayload = await req.json();
    const { childId, batchId, deviceId, clientAppVersion = '1.0.0', attempts } = body;

    if (!childId || !batchId || !attempts || !Array.isArray(attempts)) {
      return NextResponse.json({ error: 'Invalid sync payload structure.' }, { status: 400 });
    }

    // 1. Idempotency Check: Prevent duplicate syncs of the same client batch
    const existingLog = await db.offlineSyncLog.findUnique({
      where: { batchId },
    });

    if (existingLog) {
      const child = await db.childProfile.findUnique({ where: { id: childId } });
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        totalXp: child?.totalXp || 0,
        currentStreak: child?.currentStreak || 0,
      });
    }

    // 2. Fetch Child Profile
    const child = await db.childProfile.findUnique({
      where: { id: childId },
    });

    if (!child) {
      return NextResponse.json({ error: 'Child profile not found.' }, { status: 404 });
    }

    let xpToAdd = 0;

    // 3. Process Attempts & Competency Mastery
    for (const attempt of attempts) {
      const offlineDate = new Date(attempt.offlineTimestamp);

      // Create ExerciseAttempt log
      await db.exerciseAttempt.create({
        data: {
          childId,
          exerciseId: attempt.exerciseId,
          isCorrect: attempt.isCorrect,
          chosenAnswer: attempt.chosenAnswer,
          hintsUsedCount: attempt.hintsUsedCount || 0,
          timeSpentSeconds: attempt.timeSpentSeconds || 0,
          offlineTimestamp: offlineDate,
          clientBatchId: batchId,
        },
      });

      // Calculate XP
      const xpEarned = attempt.isCorrect ? 15 : 5;
      xpToAdd += xpEarned;

      // Update or create DailyActivity bucket
      const dateTruncated = new Date(offlineDate.toISOString().split('T')[0]);
      await db.dailyActivity.upsert({
        where: {
          childId_date: {
            childId,
            date: dateTruncated,
          },
        },
        create: {
          childId,
          date: dateTruncated,
          xpEarned,
          exercisesDone: 1,
          timeSeconds: attempt.timeSpentSeconds || 0,
        },
        update: {
          xpEarned: { increment: xpEarned },
          exercisesDone: { increment: 1 },
          timeSeconds: { increment: attempt.timeSpentSeconds || 0 },
        },
      });

      // Fetch exercise to update target competency mastery if linked
      const exercise = await db.exercise.findUnique({
        where: { id: attempt.exerciseId },
        include: { lesson: true },
      });

      if (exercise?.targetCompetencyCode) {
        const competency = await db.competency.findUnique({
          where: { code: exercise.targetCompetencyCode },
        });

        if (competency) {
          const existingMastery = await db.masteryRecord.findUnique({
            where: {
              childId_competencyId: {
                childId,
                competencyId: competency.id,
              },
            },
          });

          const total = (existingMastery?.totalAttempts || 0) + 1;
          const correct = (existingMastery?.correctAttempts || 0) + (attempt.isCorrect ? 1 : 0);
          const score = correct / total;

          let masteryLevel: MasteryStatus = MasteryStatus.FAMILIAR;
          if (score >= 0.85 && total >= 5) {
            masteryLevel = MasteryStatus.MASTERED;
          } else if (score >= 0.65 && total >= 3) {
            masteryLevel = MasteryStatus.PROFICIENT;
          }

          const needsIntervention = score < 0.5 && total >= 3;

          await db.masteryRecord.upsert({
            where: {
              childId_competencyId: {
                childId,
                competencyId: competency.id,
              },
            },
            create: {
              childId,
              competencyId: competency.id,
              masteryLevel,
              masteryScore: score,
              totalAttempts: 1,
              correctAttempts: attempt.isCorrect ? 1 : 0,
              consecutiveCorrect: attempt.isCorrect ? 1 : 0,
              needsIntervention,
              lastPracticedAt: offlineDate,
            },
            update: {
              masteryLevel,
              masteryScore: score,
              totalAttempts: total,
              correctAttempts: correct,
              consecutiveCorrect: attempt.isCorrect ? { increment: 1 } : 0,
              needsIntervention,
              lastPracticedAt: offlineDate,
            },
          });
        }
      }
    }

    // 4. Update Child's Cloud Streak & XP
    const newTotalXp = child.totalXp + xpToAdd;
    const today = new Date().toISOString().split('T')[0];
    const lastActive = child.lastActiveDate ? child.lastActiveDate.toISOString().split('T')[0] : null;

    let newStreak = child.currentStreak;
    if (lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      newStreak = lastActive === yesterday ? child.currentStreak + 1 : 1;
    }

    const updatedChild = await db.childProfile.update({
      where: { id: childId },
      data: {
        totalXp: newTotalXp,
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, child.longestStreak),
        lastActiveDate: new Date(),
      },
    });

    // 5. Record Idempotent Sync Log
    await db.offlineSyncLog.create({
      data: {
        childId,
        deviceId,
        batchId,
        itemsSynced: attempts.length,
        clientAppVersion,
      },
    });

    return NextResponse.json({
      success: true,
      syncedCount: attempts.length,
      totalXp: updatedChild.totalXp,
      currentStreak: updatedChild.currentStreak,
    });
  } catch (error: any) {
    console.error('[API:Sync:Error]', error);
    return NextResponse.json({ error: error?.message || 'Sync processing failure' }, { status: 500 });
  }
}
