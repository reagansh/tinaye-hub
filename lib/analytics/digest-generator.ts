import { db } from '@/lib/db';

export interface ChildDigestData {
  childId: string;
  displayName: string;
  gradeLevel: number;
  lessonsCompleted: number;
  totalTimeMinutes: number;
  streakDays: number;
  overallMasteryScore: number;
  strengths: string[];
  areasOfImprovement: string[];
  recommendationsShona: string;
  recommendationsEnglish: string;
}

export interface ParentWeeklyDigestResult {
  parentId: string;
  parentEmail: string;
  parentName: string;
  childrenData: ChildDigestData[];
}

/**
 * Compiles a weekly learning analytics snapshot for a parent's registered children.
 * Analyzes exercise attempts, identifies mastery gaps (e.g. noun classes or verb tenses),
 * and generates actionable parental coaching advice.
 */
export async function compileWeeklyParentDigest(
  parentId: string,
  startDate: Date,
  endDate: Date
): Promise<ParentWeeklyDigestResult | null> {
  const parent = await db.user.findUnique({
    where: { id: parentId },
    include: {
      children: {
        include: {
          masteryRecords: {
            include: { competency: true },
          },
          exerciseAttempts: {
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
            include: {
              exercise: {
                include: { lesson: { include: { topic: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!parent || parent.children.length === 0) {
    return null;
  }

  const childrenData: ChildDigestData[] = [];

  for (const child of parent.children) {
    const attempts = child.exerciseAttempts;
    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter((a) => a.isCorrect).length;
    const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;

    const totalSeconds = attempts.reduce((acc, a) => acc + (a.timeSpentSeconds || 30), 0);
    const totalTimeMinutes = Math.round(totalSeconds / 60);

    // Group by competency to identify strengths vs areas of improvement
    const competencyStats: Record<
      string,
      { nameShona: string; nameEnglish: string; correct: number; total: number }
    > = {};

    for (const att of attempts) {
      const code = att.exercise.targetCompetencyCode || 'GENERAL';
      if (!competencyStats[code]) {
        competencyStats[code] = {
          nameShona: att.exercise.lesson.title,
          nameEnglish: att.exercise.lesson.topic.titleEnglish,
          correct: 0,
          total: 0,
        };
      }
      competencyStats[code].total += 1;
      if (att.isCorrect) competencyStats[code].correct += 1;
    }

    const strengths: string[] = [];
    const areasOfImprovement: string[] = [];

    for (const [_code, stat] of Object.entries(competencyStats)) {
      const rate = stat.total > 0 ? (stat.correct / stat.total) * 100 : 0;
      if (rate >= 75 && stat.total >= 3) {
        strengths.push(`${stat.nameShona} (${Math.round(rate)}%)`);
      } else if (rate < 60 && stat.total >= 2) {
        areasOfImprovement.push(`${stat.nameShona} (${Math.round(rate)}%)`);
      }
    }

    // Default fallbacks if child had low or focused volume this week
    if (strengths.length === 0 && totalAttempts > 0) {
      strengths.push('Kushingaira kudzidza mazuva ose (Consistent participation)');
    }
    if (areasOfImprovement.length === 0 && totalAttempts > 0) {
      areasOfImprovement.push('Kuenderera mberi nekudzokorora zvitsauko zvakapfuura');
    }

    // Generate tailored pedagogical advice
    let recommendationsShona = `${child.displayName} ari kuratidza kushingaira kukuru muGrade ${child.gradeLevel}. `;
    let recommendationsEnglish = `${child.displayName} is demonstrating excellent consistency in Grade ${child.gradeLevel}. `;

    if (areasOfImprovement.length > 0) {
      recommendationsShona += `Kuti akwanise kukunda zvakanaka, tsvagai maminitsi gumi manheru ano achidzokorora ${areasOfImprovement[0]}. Mupei mienzaniso iri mumba!`;
      recommendationsEnglish += `To build mastery, spend 10 minutes reviewing ${areasOfImprovement[0]}. Encourage conversational practice using everyday household objects!`;
    } else {
      recommendationsShona += `Fambirai mberi nebasa rakanaka iri, munakirwe nekumukurudzira kuverenga nyaya dzekuchikoro.`;
      recommendationsEnglish += `Keep up the fantastic momentum and celebrate their current learning streak!`;
    }

    // Count distinct lessons practiced
    const distinctLessons = new Set(attempts.map((a) => a.exercise.lessonId)).size;

    childrenData.push({
      childId: child.id,
      displayName: child.displayName,
      gradeLevel: child.gradeLevel,
      lessonsCompleted: distinctLessons,
      totalTimeMinutes,
      streakDays: child.currentStreak,
      overallMasteryScore: Math.round(accuracy * 100),
      strengths,
      areasOfImprovement,
      recommendationsShona,
      recommendationsEnglish,
    });
  }

  return {
    parentId: parent.id,
    parentEmail: parent.email,
    parentName: `${parent.firstName} ${parent.lastName}`,
    childrenData,
  };
}
