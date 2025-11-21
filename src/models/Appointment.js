/*
 * File: src/models/Appointment.js
 * SR-DEV: We will re-use this model exactly as-is.
 * It's the "join" between Users and Experts.
 */

import mongoose, { Schema } from "mongoose";

const AppointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expertId: {
      type: Schema.Types.ObjectId,
      ref: "Expert",
      required: true,
      index: true,
    },
    
    // --- Denormalized User Details ---
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },

    // --- Denormalized Expert Details ---
    expertName: { type: String, required: true },
    expertImage: { type: String, default: "" },

    // --- Service & Booking Details ---
    serviceName: { type: String, required: true },
    appointmentType: {
      type: String,
      required: true,
      enum: ["Video Call", "Physical Clinic"],
    },
    appointmentDate: {
      type: Date,
      required: true,
      index: true,
    },
    appointmentTime: { type: String, required: true }, // e.g., "10:30 AM"
    duration: { type: Number, required: true }, // in minutes
    price: { type: Number, required: true },
    
    status: {
      type: String,
      required: true,
      enum: ["confirmed", "completed", "cancelled"],
      default: "confirmed",
      index: true,
    },
    
    cancellationReason: {
      type: String,
      default: null,
    },
    
    paymentId: { type: String, index: true },

    // SR-DEV: NEW FIELD
    whiteboardUrl: { type: String, default: null },

  },
  {
    timestamps: true,
    collection: "appointments",
  }
);

const Appointment =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", AppointmentSchema);

export default Appointment;