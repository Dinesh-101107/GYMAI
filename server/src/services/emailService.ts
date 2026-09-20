import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

const isConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

let transporter: nodemailer.Transporter | null = null;

if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Sends an email or prints to console in development mode.
 */
export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<boolean> {
  const from = process.env.FROM_EMAIL || 'GymMate AI <notifications@gymmate.ai>';

  if (transporter) {
    try {
      await transporter.sendMail({ from, to, subject, text, html });
      console.log(`✉️ Email dispatched to: ${to} | Subject: "${subject}"`);
      return true;
    } catch (error) {
      console.error('Email dispatch error:', error);
      return false;
    }
  }

  // Development Fallback: Log nicely formatted mock email to stdout
  console.log('----------------------------------------------------');
  console.log(`📬 [DEV EMAIL SIMULATOR] To: ${to}`);
  console.log(`📌 Subject: ${subject}`);
  console.log(`📝 Content: ${text || html?.replace(/<[^>]*>?/gm, '')}`);
  console.log('----------------------------------------------------');
  return true;
}
