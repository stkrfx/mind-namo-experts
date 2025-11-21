/*
 * File: src/actions/whiteboard.js
 * SR-DEV: Server Action to save whiteboard URL and email it to the user.
 * FIX: Uses 'sendEmail' helper instead of raw 'transporter'.
 */
"use server";

import { connectToDatabase } from "@/lib/db";
import Appointment from "@/models/Appointment";
import { sendEmail } from "@/lib/nodemailer"; // Changed import

export async function saveAndSendWhiteboard(appointmentId, fileUrl) {
  try {
    await connectToDatabase();

    // 1. Update Appointment with the URL
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { whiteboardUrl: fileUrl },
      { new: true }
    ).populate("userId");

    if (!appointment) throw new Error("Appointment not found");

    // 2. Send Email to User
    const userEmail = appointment.userId.email;
    const userName = appointment.userId.name;

    // SR-DEV: Use the helper function
    await sendEmail({
      to: userEmail,
      subject: "Your Session Whiteboard - Mind Namo",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Hi ${userName},</h2>
          <p>Your session with the expert has ended.</p>
          <p>The expert has shared the whiteboard notes from your session. You can download them securely using the link below:</p>
          <p>
            <a href="${fileUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Download Whiteboard PDF
            </a>
          </p>
          <p>This link is also available in your appointment history.</p>
          <p>Best regards,<br>Mind Namo Team</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Whiteboard Action Error:", error);
    return { success: false, error: error.message };
  }
}