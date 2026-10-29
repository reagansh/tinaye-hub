import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { compileWeeklyParentDigest } from '@/lib/analytics/digest-generator';
import { renderParentWeeklyDigestEmailHtml } from '@/lib/email/templates/ParentWeeklyDigestEmail';
import { sendEmail } from '@/lib/email/send-email';
import { EmailDeliveryStatus } from '@prisma/client';

export const maxDuration = 300; // Allow 5 minutes on Vercel Pro/Enterprise for batch processing
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // 1. Security: Verify Vercel Cron Secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[Cron:ParentDigest] Unauthorized invocation attempt rejected.');
    return NextResponse.json({ error: 'Unauthorized. Invalid Cron Secret.' }, { status: 401 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startDateStr = sevenDaysAgo.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const endDateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const portalUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinaye-hub.vercel.app';

  console.log(`[Cron:ParentDigest] Starting weekly digest run for window: ${startDateStr} to ${endDateStr}`);

  try {
    // 2. Fetch all parents opted-in to email digests
    const eligibleParents = await db.user.findMany({
      where: {
        emailDigestOptIn: true,
        children: {
          some: {}, // Must have at least 1 child
        },
      },
      select: { id: true, email: true, firstName: true },
    });

    let processedCount = 0;
    let sentCount = 0;
    const errors: string[] = [];

    // 3. Process parents in batches to stay within memory limits
    for (const parent of eligibleParents) {
      processedCount++;
      try {
        const digestResult = await compileWeeklyParentDigest(parent.id, sevenDaysAgo, now);
        if (!digestResult || digestResult.childrenData.length === 0) {
          continue;
        }

        // Render localized HTML email
        const html = renderParentWeeklyDigestEmailHtml({
          parentName: digestResult.parentName,
          startDateStr,
          endDateStr,
          children: digestResult.childrenData,
          portalUrl,
        });

        // Dispatch email
        const emailResponse = await sendEmail({
          to: digestResult.parentEmail,
          subject: `Tinaye-Hub: Gwaro reBudiriro yeMwana Svondo Rino (${startDateStr} - ${endDateStr})`,
          html,
        });

        // Record digest snapshots in database for parent dashboard history
        for (const childData of digestResult.childrenData) {
          await db.parentReportDigest.create({
            data: {
              parentId: parent.id,
              childId: childData.childId,
              weekStartDate: sevenDaysAgo,
              weekEndDate: now,
              lessonsCompleted: childData.lessonsCompleted,
              totalTimeSpentMinutes: childData.totalTimeMinutes,
              streakDays: childData.streakDays,
              overallMasteryScore: childData.overallMasteryScore / 100,
              strengthsJson: childData.strengths,
              areasOfImprovementJson: childData.areasOfImprovement,
              recommendationsShona: childData.recommendationsShona,
              recommendationsEnglish: childData.recommendationsEnglish,
              emailStatus: emailResponse.success ? EmailDeliveryStatus.SENT : EmailDeliveryStatus.FAILED,
              emailMessageId: emailResponse.messageId,
              sentAt: emailResponse.success ? new Date() : null,
            },
          });
        }

        if (emailResponse.success) {
          sentCount++;
        } else {
          errors.push(`Parent ${parent.email}: ${emailResponse.error}`);
        }
      } catch (err: any) {
        console.error(`[Cron:ParentDigest] Failed to compile digest for parent ${parent.id}:`, err);
        errors.push(`Parent ${parent.email}: ${err?.message || 'Digest failure'}`);
      }
    }

    console.log(`[Cron:ParentDigest] Run complete. Processed: ${processedCount}, Sent: ${sentCount}, Errors: ${errors.length}`);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      processedCount,
      sentCount,
      errorsCount: errors.length,
      errors: errors.slice(0, 5), // Return first 5 errors if any
    });
  } catch (error: any) {
    console.error('[Cron:ParentDigest:Fatal]', error);
    return NextResponse.json({ error: error?.message || 'Fatal error during cron execution' }, { status: 500 });
  }
}
