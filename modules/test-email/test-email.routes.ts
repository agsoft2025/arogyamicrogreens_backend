import { Router, Request, Response } from 'express';
import { sendEmail } from '../../services/emailService';

const router = Router();

/**
 * POST /api/v1/test-email
 * Sends a minimal test email to EMAIL_USER and returns a detailed
 * success or error response — use this to verify Nodemailer + Gmail
 * auth independently from the order flow.
 */
router.post('/', async (req: Request, res: Response) => {
  const recipient = process.env.EMAIL_USER;

  console.log('[TestEmail] EMAIL_USER loaded:', recipient ? 'Yes' : 'No');
  console.log('[TestEmail] EMAIL_PASS loaded:', process.env.EMAIL_PASS ? `Yes (${process.env.EMAIL_PASS.length} chars)` : 'No');

  if (!recipient) {
    return res.status(500).json({
      success: false,
      message: 'EMAIL_USER is not set in environment variables.',
    });
  }

  try {
    await sendEmail({
      to: recipient,
      subject: 'AgriNest — Test Email',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#1b3c2a;">AgriNest Email Test</h2>
          <p>If you received this, Nodemailer and Gmail authentication are working correctly.</p>
          <p style="color:#727973;font-size:13px;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    return res.json({
      success: true,
      message: 'Test email sent successfully. Check your inbox (and spam folder).',
      sentTo: recipient,
    });
  } catch (error: any) {
    console.error('[TestEmail] Send failed:', error?.message);
    console.error('[TestEmail] Error code:', error?.code);
    console.error('[TestEmail] Error response:', error?.response);

    return res.status(500).json({
      success: false,
      message: 'Failed to send test email.',
      error: error?.message,
      code: error?.code,
      response: error?.response,
    });
  }
});

export default router;
