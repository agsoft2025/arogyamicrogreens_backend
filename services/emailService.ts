import nodemailer from 'nodemailer';

/**
 * Creates a fresh Nodemailer transporter on each call.
 * Lazy creation (instead of module-level) guarantees env vars are always read
 * from their current value rather than whatever was present at import time.
 */
function createTransporter(): nodemailer.Transporter {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  // Diagnostic: confirm env vars are present (values never logged)
  console.log('[EmailService] EMAIL_USER loaded:', user ? 'Yes' : 'No');
  console.log('[EmailService] EMAIL_PASS loaded:', pass ? `Yes (${pass.length} chars)` : 'No');

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email.
 * - Creates a fresh transporter per call (ensures current env vars are used).
 * - Runs transporter.verify() before sendMail() to surface auth errors immediately.
 * - Logs the message ID on success.
 * - Throws on failure so the caller's catch block receives the full error.
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, html } = options;

  // Guard: ensure recipient is present
  if (!to) {
    throw new Error('sendEmail: recipient address (to) is undefined — check EMAIL_USER env var');
  }

  const transporter = createTransporter();

  // Verify SMTP connection + auth before attempting to send
  console.log('[EmailService] Verifying transporter...');
  await transporter.verify(); // throws on auth/connection failure
  console.log('[EmailService] Transporter verified — connection and auth OK');

  console.log('[EmailService] Sending email to:', to, '| subject:', subject);

  const info = await transporter.sendMail({
    from: `"AgriNest" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log('[EmailService] Email sent successfully — messageId:', info.messageId);
  console.log('[EmailService] Server response:', info.response);
}
