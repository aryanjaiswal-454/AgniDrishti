import nodemailer from "nodemailer";
import config from "../config";

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  static async sendPasswordResetOtp(toEmail: string, otp: string) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("⚠️ SMTP credentials not configured. Printing OTP to console instead.");
      console.log(`\n================================`);
      console.log(`OTP FOR ${toEmail}: ${otp}`);
      console.log(`================================\n`);
      return;
    }

    const mailOptions = {
      from: `"AgniDrishti Support" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: "Your Password Reset OTP - AgniDrishti",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #ea580c;">Password Reset Request</h2>
          <p>You requested to reset your password for AgniDrishti. Please use the following OTP to proceed:</p>
          <div style="background-color: #fff7ed; border: 1px solid #fed7aa; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0; color: #9a3412;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you did not request a password reset, please safely ignore this email.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${toEmail}`);
    } catch (error) {
      console.error(`Failed to send email to ${toEmail}:`, error);
      throw new Error("Failed to send email. Please try again later.");
    }
  }
}
