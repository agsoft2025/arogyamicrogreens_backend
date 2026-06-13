import { Request, Response } from 'express';
import { ContactService } from './contact.service';

const contactService = new ContactService();

export class ContactController {
  async send(req: Request, res: Response) {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required.',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    try {
      await contactService.sendContactEmail({
        name: name.trim(),
        email: email.trim(),
        subject: subject?.trim() || 'General Inquiry',
        message: message.trim(),
      });

      return res.json({
        success: true,
        message: 'Your message has been sent successfully.',
      });
    } catch (error) {
      console.error('[ContactController] Failed to send email:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send email. Please try again later.',
      });
    }
  }
}

export default new ContactController();
