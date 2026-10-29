import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL = process.env.EMAIL_FROM || 'Tinaye-Hub Reports <reports@tinaye-hub.org>';

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!resend) {
    console.warn(`[EmailService:Mock] No RESEND_API_KEY provided. Simulating email dispatch to: ${to} with subject: "${subject}"`);
    return { success: true, messageId: `mock-msg-${Date.now()}` };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    return { success: true, messageId: data.data?.id };
  } catch (err: any) {
    console.error('[EmailService:Error] Failed to send email via Resend:', err);
    return { success: false, error: err?.message || 'Unknown email error' };
  }
}
