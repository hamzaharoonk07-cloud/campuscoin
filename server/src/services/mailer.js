import nodemailer from 'nodemailer';

// ---------------------------------------------------------------------------
// Email for password resets and shared reports.
//
// SMTP is optional. With no SMTP settings the app does not pretend to send:
// it returns the message to the caller so the developer (or an evaluator
// watching the demo) can see exactly what would have gone out.
// ---------------------------------------------------------------------------

const configured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

let transport = null;
const getTransport = () => {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transport;
};

export async function sendMail({ to, subject, text, html }) {
  if (!configured()) {
    console.log(`[mail] SMTP is not configured - would have sent "${subject}" to ${to}`);
    return { sent: false, preview: { to, subject, text } };
  }

  try {
    await getTransport().sendMail({
      // Gmail only sends as the signed-in account, so that is the default sender.
      from: process.env.MAIL_FROM || `Campus Coin <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || undefined,
    });
    return { sent: true };
  } catch (err) {
    // A wrong password or a blocked account must not crash the request; the
    // caller decides what to tell the user.
    console.error(`[mail] could not send "${subject}" to ${to}: ${err.message}`);
    return { sent: false, failed: true };
  }
}

/**
 * Whether a password-reset link may be shown on screen instead of emailed.
 * Only on a development machine: on the live site that would let anyone who
 * knows an address reset that account, so there the link is only ever emailed.
 * ALLOW_SCREEN_RESET_LINK=1 turns it on deliberately for a local demo.
 */
export const screenResetLinkAllowed = () =>
  process.env.ALLOW_SCREEN_RESET_LINK === '1' || (process.env.NODE_ENV !== 'production' && !process.env.VERCEL);

export const mailConfigured = configured;
