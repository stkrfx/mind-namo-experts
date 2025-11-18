/*
 * File: src/lib/nodemailer.js
 * SR-DEV: This file is identical to the one in
 * mind-namo-users and is re-used here.
 */

import nodemailer from "nodemailer";

const {
  NODE_ENV,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  EMAIL_FROM_ADDRESS,
  EMAIL_FROM_NAME,
  EMAIL_DEV_USER,
  EMAIL_DEV_PASS,
} = process.env;

let transporter;

if (NODE_ENV === "production" && SMTP_HOST) {
  // --- PRODUCTION TRANSPORTER ---
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || "587", 10),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  console.log("Nodemailer configured for Production SMTP.");
} else if (NODE_ENV !== "production" && EMAIL_DEV_USER && EMAIL_DEV_PASS) {
  // --- DEVELOPMENT TRANSPORTER (Gmail) ---
  console.warn("*******************************************");
  console.warn("WARNING: Nodemailer is using Gmail for dev.");
  console.warn("*******************************************");
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_DEV_USER,
      pass: EMAIL_DEV_PASS,
    },
  });
} else {
  // --- MOCK TRANSPORTER (No Email Service) ---
  console.log("----------------------------------------------------");
  console.log("Nodemailer is in MOCK mode.");
  console.log("----------------------------------------------------");

  transporter = {
    sendMail: async (options) => {
      console.log("--- MOCK EMAIL START ---");
      console.log(`To: ${options.to}`);
      console.log(`From: ${options.from}`);
      console.log(`Subject: ${options.subject}`);
      console.log(options.html);
      console.log("--- MOCK EMAIL END ---");
      return {
        messageId: `mock-${new Date().toISOString()}`,
        accepted: [options.to],
      };
    },
  };
}

export const sendEmail = async ({ to, subject, text, html }) => {
  const fromName = EMAIL_FROM_NAME || "Mind Namo (Experts)"; // Small tweak
  const fromAddress = EMAIL_FROM_ADDRESS || EMAIL_DEV_USER;

  if (!to || !subject || (!text && !html)) {
    console.error("sendEmail: Missing required parameters.");
    return { success: false, error: "Missing required parameters." };
  }
  if (!fromAddress) {
    console.error("sendEmail: Email service not configured.");
    return { success: false, error: "Email service not configured." };
  }

  const mailOptions = {
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    if (NODE_ENV !== "production") {
      console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error.message);
    return { success: false, error: "Failed to send email." };
  }
};