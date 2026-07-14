import nodemailer from 'nodemailer'

// SMTP creds come from .env (Hostinger email in production).
// Without SMTP_HOST set, mails are logged to console (dev mode).
export async function sendMail({ to, subject, html }) {
  if (!process.env.SMTP_HOST) {
    console.log('[mail:dev]', { to, subject, html })
    return
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_PORT || '465') === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  await transport.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html })
}
