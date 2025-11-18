/*
 * File: src/lib/emailTemplates.js
 * SR-DEV: This is re-used, but I've added a new "Welcome Expert"
 * template, as this will be a different flow from the user.
 */

import { cn } from "./utils"; // We'll need this for the new template

// SR-DEV: Centralize branding config from environment variables
const {
  APP_NAME = "Mind Namo",
  APP_BRAND_COLOR = "#3B82F6",
  APP_LOGO_URL,
  APP_URL = "http://localhost:3000",
} = process.env;

const fontStack = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/**
 * @description The "Master" template that wraps all email content.
 */
const masterTemplate = ({ preheaderText, header, body, footer }) => {
  // ... (Master template code is identical to user project, redacting for brevity) ...
  const headerContent = APP_LOGO_URL
    ? `<img src="${APP_LOGO_URL}" alt="${APP_NAME}" style="max-height: 40px; border: 0; padding-bottom: 20px;">`
    : `<h1 style="margin: 0; padding-bottom: 20px; font-family: ${fontStack}; font-size: 28px; font-weight: bold; color: #1a1a1a;">${APP_NAME} Experts</h1>`;

  return `
  <!DOCTYPE html>
  <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${header}</title>
    <!--[if gte mso 9]>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
    <style type="text/css">
      /* SR-DEV: Email Client Resets. These are critical. */
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
      body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f7f7f7; }
      /* Fallback for system fonts */
      @font-face {
        font-family: 'system-ui';
        src: local('.SFNSText-Regular'), local('HelveticaNeue-Light'), local('Segoe UI'), local('Roboto-Regular');
        font-weight: 400;
        font-style: normal;
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f7f7f7;">
  
    <!-- HIDDEN PREHEADER TEXT -->
    <div style="display: none; font-size: 1px; color: #f7f7f7; line-height: 1px; font-family: ${fontStack}; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
      ${preheaderText}
    </div>
  
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px;">
      <tr>
        <td align="center">
          ${headerContent}
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 0 10px 0 10px;">
          <!-- MAIN CONTAINER TABLE -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; border-radius: 12px; overflow: hidden;">
            <!-- HEADER -->
            <tr>
              <td bgcolor="${APP_BRAND_COLOR}" align="center" style="padding: 25px 30px; border-radius: 12px 12px 0 0;">
                <h2 style="margin: 0; font-family: ${fontStack}; font-size: 24px; font-weight: bold; color: #ffffff;">
                  ${header}
                </h2>
              </td>
            </tr>
            <!-- BODY -->
            <tr>
              <td bgcolor="#ffffff" align="left" style="padding: 30px 30px 40px 30px; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">
                <div style="font-family: ${fontStack}; font-size: 16px; line-height: 1.6; color: #333333;">
                  ${body}
                </div>
              </td>
            </tr>
            <!-- FOOTER -->
            <tr>
              <td bgcolor="#ffffff" align="center" style="padding: 0 30px 30px 30px; border-radius: 0 0 12px 12px; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">
                <p style="margin: 0; font-family: ${fontStack}; font-size: 13px; color: #777777; line-height: 1.5;">
                  ${footer}
                </p>
                <p style="margin: 10px 0 0 0; font-family: ${fontStack}; font-size: 13px; color: #777777;">
                  © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                </p>
                <p style="margin: 10px 0 0 0; font-family: ${fontStack}; font-size: 13px; color: #777777;">
                  <a href="${APP_URL}" target="_blank" style="color: #777777; text-decoration: underline;">Visit our website</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  
  </body>
  </html>
    `;
};

/**
 * @description Generates the HTML for the One-Time Password (OTP) email.
 */
export const getOtpEmailHtml = ({ otp }) => {
  const preheaderText = `Your ${APP_NAME} Experts verification code is ${otp}`;
  const header = "Your Verification Code";
  const body = `
      <p style="margin-bottom: 25px;">Welcome to the ${APP_NAME} Expert Portal. Please use the One-Time Password (OTP) below to verify your email address.</p>
      
      <div style="background-color: #f4f4f4; border-radius: 8px; padding: 15px 20px; text-align: center; margin: 20px 0;">
        <p style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #1a1a1a;">
          ${otp}
        </p>
      </div>
  
      <p style="margin-bottom: 25px;">This code will expire in 10 minutes.</p>
      <p style="margin: 0;">If you did not request this, please ignore this email.</p>
    `;
  const footer = "You received this email because you are signing up for an expert account.";

  return masterTemplate({ preheaderText, header, body, footer });
};

/**
 * @description Generates the HTML for the "Forgot Password" email.
 */
export const getPasswordResetEmailHtml = ({ name, resetLink }) => {
  const preheaderText = `Reset your password for ${APP_NAME} Experts.`;
  const header = "Password Reset Request";
  const body = `
      <p style="margin-bottom: 25px;">Hi ${name},</p>
      <p style="margin-bottom: 25px;">We received a request to reset your password. Click the button below to set a new one:</p>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 25px;">
        <tr>
          <td align="center">
            <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: ${fontStack}; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; background-color: ${APP_BRAND_COLOR}; border-radius: 8px;">
              Reset Your Password
            </a>
          </td>
        </tr>
      </table>
  
      <p style="margin-bottom: 25px;">This link will expire in 1 hour.</p>
      <p style="margin: 0;">If you did not request this, please ignore this email.</p>
    `;
  const footer = "You received this email because a password reset was requested for your expert account.";

  return masterTemplate({ preheaderText, header, body, footer });
};

/**
 * @description Generates the HTML for the "Booking Confirmation" email (for the *Expert*).
 * SR-DEV: This is a new template for the expert portal.
 */
export const getExpertBookingNotificationEmailHtml = ({
  expertName,
  userName,
  serviceName,
  date,
  time,
  type,
}) => {
  const preheaderText = `New booking from ${userName}!`;
  const header = "You Have a New Booking!";
  const body = `
      <p style="margin-bottom: 25px;">Hi ${expertName},</p>
      <p style="margin-bottom: 25px;">A new appointment has been booked with you by <strong>${userName}</strong>. Please review the details below:</p>
      
      <div style="background-color: #f4f4f4; border-radius: 8px; padding: 20px; margin: 20px 0; font-family: ${fontStack};">
        <p style="margin: 0 0 15px 0;"><strong>Client:</strong><br>${userName}</p>
        <p style="margin: 0 0 15px 0;"><strong>Service:</strong><br>${serviceName}</p>
        <p style="margin: 0 0 15px 0;"><strong>Date:</strong><br>${date}</p>
        <p style="margin: 0 0 15px 0;"><strong>Time:</strong><br>${time}</p>
        <p style="margin: 0;"><strong>Type:</strong><br>${type}</p>
      </div>
  
      <p style="margin-bottom: 25px;">You can manage all your appointments from your expert dashboard:</p>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 25px;">
        <tr>
          <td align="center">
            <a href="${APP_URL}/" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: ${fontStack}; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; background-color: ${APP_BRAND_COLOR}; border-radius: 8px;">
              Go to Your Dashboard
            </a>
          </td>
        </tr>
      </table>
    `;
  const footer = "You received this email because a client booked an appointment with you on " + APP_NAME + ".";

  return masterTemplate({ preheaderText, header, body, footer });
};