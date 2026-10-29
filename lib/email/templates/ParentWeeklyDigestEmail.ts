import { ChildDigestData } from '@/lib/analytics/digest-generator';

export interface EmailTemplateProps {
  parentName: string;
  startDateStr: string;
  endDateStr: string;
  children: ChildDigestData[];
  portalUrl: string;
}

export function renderParentWeeklyDigestEmailHtml({
  parentName,
  startDateStr,
  endDateStr,
  children,
  portalUrl,
}: EmailTemplateProps): string {
  const childrenCards = children
    .map(
      (child) => `
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #edf2f7; padding-bottom: 16px; margin-bottom: 16px;">
        <div>
          <h2 style="margin: 0; color: #1a202c; font-size: 20px; font-weight: 700;">${child.displayName}</h2>
          <span style="color: #4a5568; font-size: 13px; font-weight: 500;">Giredhi (Grade) ${child.gradeLevel} &bull; ZIMSEC Primary</span>
        </div>
        <div style="background-color: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 700;">
          &#128293; Streak: ${child.streakDays} mazuva
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
        <tr>
          <td width="33%" style="background-color: #f8fafc; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 22px; font-weight: 800; color: #1e293b;">${child.lessonsCompleted}</div>
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Zvidzidzo (Lessons)</div>
          </td>
          <td width="5%"></td>
          <td width="33%" style="background-color: #f8fafc; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 22px; font-weight: 800; color: #0284c7;">${child.totalTimeMinutes}m</div>
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Nguva (Time)</div>
          </td>
          <td width="5%"></td>
          <td width="33%" style="background-color: #f8fafc; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 22px; font-weight: 800; color: #15803d;">${child.overallMasteryScore}%</div>
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Kugona (Accuracy)</div>
          </td>
        </tr>
      </table>

      <!-- Strengths & Weaknesses Sections -->
      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 14px; font-weight: 700;">
          &#9989; Zvaakaita Zvakanaka (Areas of Strength):
        </h4>
        <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 13px; line-height: 1.6;">
          ${child.strengths.map((s) => `<li>${s}</li>`).join('')}
        </ul>
      </div>

      <div style="margin-bottom: 20px;">
        <h4 style="margin: 0 0 8px 0; color: #b45309; font-size: 14px; font-weight: 700;">
          &#9888;&#65039; Zvinoda Dzokororo (Focus Areas for Next Week):
        </h4>
        <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 13px; line-height: 1.6;">
          ${child.areasOfImprovement.map((w) => `<li>${w}</li>`).join('')}
        </ul>
      </div>

      <!-- Actionable Parental Coaching Tip -->
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px 16px; border-radius: 0 8px 8px 0;">
        <div style="font-size: 12px; font-weight: 700; color: #15803d; text-transform: uppercase; margin-bottom: 4px;">
          Zano reMubereki (Home Practice Tip):
        </div>
        <p style="margin: 0; font-size: 13px; color: #166534; line-height: 1.5;">
          ${child.recommendationsShona}
        </p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #4b5563; font-style: italic;">
          "${child.recommendationsEnglish}"
        </p>
      </div>
    </div>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="sn">
<head>
  <meta charset="UTF-8">
  <title>Tinaye-Hub: Gwaro reBudiriro yeMwana Svondo Rino</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);">
    
    <!-- Header Banner -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a2f 0%, #2d6a4f 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">TINAYE-HUB</h1>
        <p style="margin: 6px 0 0 0; font-size: 14px; color: #d8f3dc; font-weight: 500;">
          Gwaro reBudiriro yeMwana Svondo Rino &bull; Weekly Progress Digest
        </p>
        <div style="display: inline-block; margin-top: 12px; background-color: rgba(255,255,255,0.15); padding: 4px 14px; border-radius: 20px; font-size: 12px; color: #f0fdf4;">
          ${startDateStr} kusvika ${endDateStr}
        </div>
      </td>
    </tr>

    <!-- Salutation Body -->
    <tr>
      <td style="padding: 28px 24px 8px 24px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.6;">
          Kwaziwai Mubereki <strong>${parentName}</strong>,
        </p>
        <p style="margin: 0 0 24px 0; font-size: 14px; color: #475569; line-height: 1.6;">
          Hechino chidimbu chekufambira mberi kwevana venyu paTinaye-Hub pasvondo rino. Zviri pachena kuti kudzidzira mazuva ose kunovaka ruzivo rwakasimba rwemutauro weChiShona maererano nezvinodiwa neZIMSEC.
        </p>

        <!-- Children Learning Cards -->
        ${childrenCards}

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0 16px 0;">
          <a href="${portalUrl}" style="background-color: #2d6a4f; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">
            Vhura Dashboard reMubereki &rarr;
          </a>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5;">
        <p style="margin: 0 0 8px 0;">
          Tinaye-Hub &bull; Chirongwa cheDzidzo yeChiShona (Grades 1–7)
        </p>
        <p style="margin: 0;">
          Muri kugamuchira email iyi nokuti makanyoresa semubereki paTinaye-Hub. 
          Kuti musandure maonero, pinda pa <a href="${portalUrl}/settings" style="color: #2d6a4f; text-decoration: underline;">Settings</a>.
        </p>
      </td>
    </tr>

  </table>
</body>
</html>
  `;
}
