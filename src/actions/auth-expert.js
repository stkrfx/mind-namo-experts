/*
 * File: src/actions/auth-expert.js
 * SR-DEV: This is the new Server Action file that
 * was missing and causing the build error.
 * It contains the exports for expert registration.
 */

"use server";

import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
// SR-DEV: CRITICAL - We import the Expert model here.
import Expert from "@/models/Expert";
import { sendEmail } from "@/lib/nodemailer";
import { getOtpEmailHtml } from "@/lib/emailTemplates";

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * @typedef {object} ActionResult
 * @property {boolean} success
 * @property {string} message
 * @property {string} [email]
 */

/**
 * @name registerExpertAction
 * @description Handles expert registration.
 *
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function registerExpertAction(formData) {
  try {
    const fullName = formData.get("fullName")?.toString().trim();
    const email = formData.get("email")?.toString().toLowerCase().trim();
    const password = formData.get("password");

    if (!fullName || !email || !password) {
      return { success: false, message: "All fields are required." };
    }
    if (password.length < 8) {
      return { success: false, message: "Password must be at least 8 characters." };
    }

    await connectToDatabase();

    const existingExpert = await Expert.findOne({ email, isVerified: true });
    if (existingExpert) {
      return { success: false, message: "An expert with this email already exists." };
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let expert = await Expert.findOne({ email });

    if (expert) {
      // Expert exists but is not verified. Update details.
      expert.name = fullName;
      expert.password = password; // Pre-save hook will hash
      expert.otp = otp;
      expert.otpExpires = otpExpires;
      await expert.save();
    } else {
      // Create a new expert.
      await Expert.create({
        name: fullName,
        email,
        password, // Pre-save hook will hash
        otp,
        otpExpires,
      });
    }

    // --- Send Verification Email ---
    const emailHtml = getOtpEmailHtml({ otp });
    const emailResult = await sendEmail({
      to: email,
      subject: `Verify your ${process.env.APP_NAME || "Mind Namo"} Expert Account`,
      html: emailHtml,
    });

    if (!emailResult.success) {
      return {
        success: false,
        message: "Account created, but failed to send verification email.",
      };
    }

    return {
      success: true,
      message: "Registration successful! Check your email for an OTP.",
      email: email,
    };
  } catch (error) {
    console.error("Server Action [registerExpertAction] Error:", error);
    if (error.code === 11000) {
      return { success: false, message: "This email is already registered." };
    }
    return { success: false, message: "Registration failed due to a server error." };
  }
}

/**
 * @name resendExpertOtpAction
 * @description Resends a new OTP to an expert's email.
 *
 * @param {string} email
 * @returns {Promise<ActionResult>}
 */
export async function resendExpertOtpAction(email) {
  try {
    const normalizedEmail = email?.toString().toLowerCase().trim();
    if (!normalizedEmail) {
      return { success: false, message: "Email is required." };
    }

    await connectToDatabase();
    const expert = await Expert.findOne({ email: normalizedEmail });

    if (!expert) {
      return { success: false, message: "Could not find account." };
    }
    if (expert.isVerified) {
      return { success: false, message: "This account is already verified." };
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    expert.otp = otp;
    expert.otpExpires = otpExpires;
    await expert.save();

    const emailHtml = getOtpEmailHtml({ otp });
    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: `Your New ${process.env.APP_NAME || "Mind Namo"} Expert OTP`,
      html: emailHtml,
    });

    if (!emailResult.success) {
      return { success: false, message: "Failed to send new OTP." };
    }
    return { success: true, message: "A new OTP has been sent." };
  } catch (error) {
    console.error("Server Action [resendExpertOtpAction] Error:", error);
    return { success: false, message: "An error occurred." };
  }
}