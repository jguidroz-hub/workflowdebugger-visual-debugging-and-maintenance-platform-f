import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || 'WorkflowDebugger - Visual debugging and maintenance platform for multi-step automation workflows <noreply@example.com>';
const APP_NAME = 'WorkflowDebugger - Visual debugging and maintenance platform for multi-step automation workflows';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ──────────────────────────────────────────────────────────
// Shared HTML wrapper
// ──────────────────────────────────────────────────────────
function wrap(body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="padding:32px 40px">
      <div style="font-size:18px;font-weight:700;color:#111;margin-bottom:24px">${APP_NAME}</div>
      ${body}
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">
        &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ──────────────────────────────────────────────────────────
// Auth Emails
// ──────────────────────────────────────────────────────────
export async function sendWelcomeEmail(email: string, name?: string | null) {
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Welcome to ${APP_NAME}!`,
    html: wrap(`
      <p style="color:#374151;line-height:1.6">${greeting}</p>
      <p style="color:#374151;line-height:1.6">Thanks for signing up! Your account is ready to go.</p>
      <div style="margin:24px 0;text-align:center">
        <a href="${APP_URL}/dashboard" style="display:inline-block;padding:12px 32px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
          Go to Dashboard →
        </a>
      </div>
      <p style="color:#6b7280;font-size:14px">If you didn't create this account, you can safely ignore this email.</p>
    `),
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Reset your ${APP_NAME} password`,
    html: wrap(`
      <p style="color:#374151;line-height:1.6">You requested a password reset. Click below to set a new password:</p>
      <div style="margin:24px 0;text-align:center">
        <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
          Reset Password
        </a>
      </div>
      <p style="color:#6b7280;font-size:14px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      <p style="color:#9ca3af;font-size:12px;word-break:break-all">Or copy this URL: ${resetUrl}</p>
    `),
  });
}

// ──────────────────────────────────────────────────────────
// Billing Emails
// ──────────────────────────────────────────────────────────
export async function sendPaymentFailedEmail(email: string, details: {
  attemptCount: number;
  nextAttemptDate?: string;
  updatePaymentUrl: string;
}) {
  const urgent = details.attemptCount >= 3;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: urgent
      ? `⚠️ Action required: Update your ${APP_NAME} payment method`
      : `Payment failed for ${APP_NAME}`,
    html: wrap(`
      <p style="color:#374151;line-height:1.6">We were unable to process your payment${details.attemptCount > 1 ? ` (attempt ${details.attemptCount})` : ''}.</p>
      ${urgent ? '<p style="color:#dc2626;font-weight:600">Your account may be suspended if payment is not updated soon.</p>' : ''}
      ${details.nextAttemptDate ? `<p style="color:#6b7280;font-size:14px">We\'ll retry on ${details.nextAttemptDate}.</p>` : ''}
      <div style="margin:24px 0;text-align:center">
        <a href="${details.updatePaymentUrl}" style="display:inline-block;padding:12px 32px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
          Update Payment Method
        </a>
      </div>
    `),
  });
}

export async function sendSubscriptionEmail(email: string, event: 'created' | 'cancelled' | 'renewed', planName: string) {
  const subjects: Record<string, string> = {
    created: `Welcome to ${APP_NAME} ${planName}!`,
    cancelled: `Your ${APP_NAME} subscription has been cancelled`,
    renewed: `Your ${APP_NAME} subscription has been renewed`,
  };
  const bodies: Record<string, string> = {
    created: `<p style="color:#374151;line-height:1.6">You're now on the <strong>${planName}</strong> plan. Enjoy all the features!</p>`,
    cancelled: `<p style="color:#374151;line-height:1.6">Your <strong>${planName}</strong> plan has been cancelled. You'll retain access until the end of your billing period.</p>
      <p style="color:#6b7280;font-size:14px">Changed your mind? You can resubscribe anytime from your billing settings.</p>`,
    renewed: `<p style="color:#374151;line-height:1.6">Your <strong>${planName}</strong> plan has been renewed. Thanks for being a subscriber!</p>`,
  };

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: subjects[event],
    html: wrap(bodies[event]),
  });
}
