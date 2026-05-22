/**
 * Email notification helper using Resend API.
 * Resend: https://resend.com — free up to 3,000 emails/month
 *
 * Setup:
 * 1. Create account at resend.com
 * 2. Add domain (abd1llh.online) and verify DNS
 * 3. Get API key from Dashboard → API Keys
 * 4. Add RESEND_API_KEY to .env
 * 5. Add ADMIN_EMAIL to .env (default: me@abd1llh.online)
 */

const RESEND_API_URL = 'https://api.resend.com/emails';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'me@abd1llh.online';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@abd1llh.online';

/**
 * Send admin notification when a contact form is submitted.
 * @param {Object} params
 * @param {string} params.name     - Sender name
 * @param {string} params.email    - Sender email
 * @param {string} params.message  - Message content
 * @param {string} [params.locale] - Language (en|ar)
 * @returns {Promise<boolean>}
 */
export async function sendContactNotification({ name, email, message, locale = 'en' }) {
    if (!RESEND_API_KEY) {
        console.warn('[email] RESEND_API_KEY not set — skipping email notification.');
        return false;
    }

    const isAr = locale === 'ar';
    const subject = isAr
        ? `[abd1llh.online] رسالة جديدة من ${name}`
        : `[abd1llh.online] New message from ${name}`;

    const html = `
<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
</head>
<body style="
  background: #0a0a0a;
  color: #efefef;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace, sans-serif;
  margin: 0;
  padding: 32px 16px;
">
  <div style="
    max-width: 560px;
    margin: 0 auto;
    background: #111;
    border: 1px solid #222;
    border-radius: 16px;
    overflow: hidden;
  ">

    <!-- Header -->
    <div style="
      background: #0d0d0d;
      border-bottom: 1px solid #1a1a1a;
      padding: 20px 28px;
      display: flex;
      align-items: center;
      gap: 12px;
    ">
      <span style="color: #00d95f; font-weight: bold; font-family: monospace; font-size: 18px;">>_</span>
      <span style="color: #888; font-size: 12px; font-family: monospace;">abd1llh.online / contact-inbox</span>
    </div>

    <!-- Body -->
    <div style="padding: 28px;">
      <h2 style="
        color: #00d95f;
        font-family: monospace;
        font-size: 14px;
        letter-spacing: 1px;
        text-transform: uppercase;
        margin: 0 0 24px;
      ">
        ${isAr ? '[ رسالة جديدة واردة ]' : '[ NEW CONTACT MESSAGE ]'}
      </h2>

      <!-- Sender details -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="
            padding: 10px 14px;
            background: #0d0d0d;
            border: 1px solid #1a1a1a;
            border-radius: 8px 8px 0 0;
            color: #888;
            font-size: 11px;
            font-family: monospace;
            text-transform: uppercase;
            letter-spacing: 1px;
          ">${isAr ? 'الاسم' : 'NAME'}</td>
          <td style="
            padding: 10px 14px;
            background: #0d0d0d;
            border: 1px solid #1a1a1a;
            border-top: none;
            color: #fff;
            font-size: 14px;
          ">${escapeHtmlEmail(name)}</td>
        </tr>
        <tr>
          <td style="
            padding: 10px 14px;
            background: #0d0d0d;
            border: 1px solid #1a1a1a;
            border-top: none;
            color: #888;
            font-size: 11px;
            font-family: monospace;
            text-transform: uppercase;
            letter-spacing: 1px;
          ">${isAr ? 'البريد' : 'EMAIL'}</td>
          <td style="
            padding: 10px 14px;
            background: #0d0d0d;
            border: 1px solid #1a1a1a;
            border-top: none;
            color: #00d95f;
            font-family: monospace;
            font-size: 14px;
          ">
            <a href="mailto:${escapeHtmlEmail(email)}" style="color: #00d95f; text-decoration: none;">
              ${escapeHtmlEmail(email)}
            </a>
          </td>
        </tr>
      </table>

      <!-- Message -->
      <div style="margin-bottom: 28px;">
        <div style="
          color: #888;
          font-size: 11px;
          font-family: monospace;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
        ">${isAr ? 'الرسالة' : 'MESSAGE'}</div>
        <div style="
          background: #0d0d0d;
          border: 1px solid #1a1a1a;
          border-radius: 8px;
          padding: 16px;
          color: #ddd;
          font-size: 14px;
          line-height: 1.7;
          white-space: pre-wrap;
          direction: ${isAr ? 'rtl' : 'ltr'};
          text-align: ${isAr ? 'right' : 'left'};
        ">${escapeHtmlEmail(message)}</div>
      </div>

      <!-- Reply CTA -->
      <a href="mailto:${escapeHtmlEmail(email)}?subject=Re: ${encodeURIComponent(isAr ? `رد على رسالة ${name}` : `Re: Message from ${name}`)}"
         style="
           display: inline-block;
           background: #00d95f;
           color: #000;
           text-decoration: none;
           padding: 12px 24px;
           border-radius: 999px;
           font-weight: bold;
           font-size: 14px;
           font-family: monospace;
         ">
        ${isAr ? 'رد على الرسالة' : 'Reply to Message'} →
      </a>
    </div>

    <!-- Footer -->
    <div style="
      background: #0d0d0d;
      border-top: 1px solid #1a1a1a;
      padding: 16px 28px;
      text-align: center;
      color: #555;
      font-size: 11px;
      font-family: monospace;
    ">
      abd1llh.online · automated notification · do not reply to this email
    </div>
  </div>
</body>
</html>`;

    try {
        const response = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: [ADMIN_EMAIL],
                reply_to: email,
                subject,
                html,
            }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error('[email] Resend error:', result);
            return false;
        }

        console.log('[email] Notification sent:', result.id);
        return true;

    } catch (err) {
        console.error('[email] Failed to send notification:', err.message);
        return false;
    }
}

function escapeHtmlEmail(str) {
    return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
