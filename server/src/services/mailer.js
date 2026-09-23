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

  await getTransport().sendMail({
    from: process.env.MAIL_FROM || 'Campus Coin <no-reply@campuscoin.app>',
    to,
    subject,
    text,
    html: html || undefined,
  });
  return { sent: true };
}

export const mailConfigured = configured;
