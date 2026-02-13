/**
 * Billing-specific email templates.
 * Import and merge with the base email module.
 */

import { Resend } from 'resend';

let resend: Resend | null = null;
function getResend(): Resend | null {
  if (resend) return resend;
  if (!process.env.RESEND_API_KEY) return null;
  resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@projectgreenbelt.com';
const APP = 'WorkflowDebugger - Visual debugging and maintenance platform for multi-step automation workflows';
const URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

function wrap(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
<div style="background:#2563eb;padding:32px 24px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:24px;">${APP}</h1>
</div>
<div style="padding:32px 24px;">${content}</div>
<div style="padding:16px 24px;text-align:center;color:#9ca3af;font-size:12px;">
<p>${APP} &bull; <a href="${URL}" style="color:#2563eb;">Visit</a></p>
</div></div></body></html>`;
}

export async function sendPaymentFailedEmail(email: string, name?: string) {
  const r = getResend();
  if (!r) return;

  await r.emails.send({
    from: FROM,
    to: email,
    subject: `Action needed: Payment failed for ${APP}`,
    html: wrap(`
      <h2 style="color:#111827;margin:0 0 16px;">Payment Failed</h2>
      <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
        Hi${name ? ' ' + name : ''},
      </p>
      <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
        We weren't able to process your latest payment for ${APP}. 
        This is usually due to an expired card or insufficient funds.
      </p>
      <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
        Please update your payment method within 7 days to keep your access.
      </p>
      <a href="${URL}/dashboard/billing" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
        Update Payment Method →
      </a>
      <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;">
        If you've already updated your card, you can ignore this email. 
        Need help? Reply to this email.
      </p>
    `),
  });
}

export async function sendSubscriptionEmail(email: string, planName: string) {
  const r = getResend();
  if (!r) return;

  await r.emails.send({
    from: FROM,
    to: email,
    subject: `Welcome to ${APP} ${planName}!`,
    html: wrap(`
      <h2 style="color:#111827;margin:0 0 16px;">You're all set! 🎉</h2>
      <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
        You're now on the <strong>${planName}</strong> plan. All premium features are unlocked.
      </p>
      <a href="${URL}/dashboard" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
        Go to Dashboard →
      </a>
    `),
  });
}
