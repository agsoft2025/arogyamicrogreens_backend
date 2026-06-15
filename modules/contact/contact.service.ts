import nodemailer from 'nodemailer';

export interface ContactEmailDto {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export class ContactService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendContactEmail(dto: ContactEmailDto): Promise<void> {
    const { name, email, subject, message } = dto;
    const submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    await this.transporter.sendMail({
      from: `"AgriNest Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #032616;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 120px;">Name:</td>
              <td style="padding: 8px;">${name}</td>
            </tr>
            <tr style="background: #f5f5f5;">
              <td style="padding: 8px; font-weight: bold;">Email:</td>
              <td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Subject:</td>
              <td style="padding: 8px;">${subject}</td>
            </tr>
            <tr style="background: #f5f5f5;">
              <td style="padding: 8px; font-weight: bold;">Submitted At:</td>
              <td style="padding: 8px;">${submittedAt} IST</td>
            </tr>
          </table>
          <h3 style="color: #032616; margin-top: 24px;">Message:</h3>
          <div style="background: #f9f9f9; padding: 16px; border-left: 4px solid #386b00; border-radius: 4px;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
      `,
    });
  }
}
