import nodemailer from "nodemailer";
import { env } from "./env.js";

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
});

export async function sendDocEmail(
  to: string, 
  subject: string, 
  html: string, 
  attach?: { filename: string; content: Buffer }
) {
  return transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
    attachments: attach ? [attach] : []
  });
}

