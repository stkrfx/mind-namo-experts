/*
 * File: src/models/Expert.js
 * SR-DEV: This is the core model for our new expert portal.
 * I have updated it to support Google Sign-In.
 */

import mongoose, { Schema } from "mongoose";
// SR-DEV: THE FIX - Import bcrypt for hashing/comparison
import bcrypt from "bcrypt";

// ---
// SR-DEV: Sub-document Schemas (Unchanged)
// ---
// SR-DEV: Sub-document Schemas
// ---

/**
 * @description Schema for attached documents (e.g., certifications, licenses).
 */
const DocumentSchema = new Schema({
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true }, // URL to the hosted document (e.g., S3)
  type: {
    type: String,
    required: true,
    enum: {
      values: ["image", "pdf"],
      message: "{VALUE} is not a supported document type. Only 'image' or 'pdf'.",
    },
  },
});

/**
 * @description Schema for individual client reviews.
 */
const ReviewSchema = new Schema({
  reviewerName: { type: String, required: true, trim: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 2000 },
  date: { type: Date, default: Date.now },
});

/**
 * @description Schema for services offered by the expert.
 */
const ServiceSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  }, // e.g., "Cognitive Behavioral Therapy (CBT)"
  duration: {
    type: Number,
    required: true,
    min: 15,
  }, // Duration in minutes
  videoPrice: {
    type: Number,
    min: 0,
    default: null,
  },
  clinicPrice: {
    type: Number,
    min: 0,
    default: null,
  },
});

/**
 * @description Schema for an expert's weekly availability slots.
 */
const AvailabilitySlotSchema = new Schema(
  {
    dayOfWeek: {
      type: String,
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    startTime: {
      type: String,
      required: true,
      match: [
        /^([0-1]\d|2[0-3]):([0-5]\d)$/, // 24-hour HH:MM format
        "Start time must be in HH:MM format (e.g., 09:00 or 14:30).",
      ],
    },
    endTime: {
      type: String,
      required: true,
      match: [
        /^([0-1]\d|2[0-3]):([0-5]\d)$/, // 24-hour HH:MM format
        "End time must be in HH:MM format (e.g., 09:00 or 17:30).",
      ],
    },
  },
  { _id: false } // SR-DEV: Optimization - no need for individual _id on slots.
);

// ---
// SR-DEV: The Main Expert Schema (Updated)
// ---
const ExpertSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address.",
      ],
      index: true, 
    },
    // SR-DEV: This is the name the expert registers with.
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
    },
    // SR-DEV: This is the expert's password.
    password: {
      type: String,
      // SR-DEV: THE FIX - Password is no longer required
      // if this is a Google OAuth-only account.
      required: function () {
        return !this.googleId;
      },
      minlength: [8, "Password must be at least 8 characters long."],
      select: false, // Don't return password by default
    },
    // SR-DEV: Auth fields, same as the User model.
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
      default: null,
    },
    otpExpires: {
      type: Date,
      select: false,
      default: null,
      index: true,
      sparse: true,
    },
    
    // SR-DEV: THE FIX - Added googleId field
    // to support Google Sign-In for experts.
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },

    // ---
    // SR-DEV: ALL fields below are for the "Settings" page.
    // An expert will fill these out *after* registering.
    // We set defaults to empty/null states.
    // ---
    specialization: {
      type: String,
      trim: true,
      index: true,
      default: "",
    },
    profilePicture: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, "Bio cannot be more than 1000 characters."],
      default: "",
    },
    experienceYears: {
      type: Number,
      min: 0,
      default: 0,
    },
    education: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      index: true,
      default: "",
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Non-Binary", "Prefer not to say", ""],
      default: "",
    },
    languages: {
      type: [String],
      default: [],
    },

    // --- Embedded Complex Fields ---
    documents: {
      type: [DocumentSchema],
      default: [],
    },
    reviews: {
      type: [ReviewSchema],
      default: [],
    },
    services: {
      type: [ServiceSchema],
      default: [],
    },
    availability: {
      type: [AvailabilitySlotSchema],
      default: [],
    },

    // SR-DEV: New fields for Online Status
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "experts", // Use a separate "experts" collection
  }
);

// SR-DEV: Add the same secure pre-save hook for password hashing
const BCRYPT_SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '12', 10);
ExpertSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  try {
    this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
    next();
  } catch (error) {
    next(error);
  }
});

// SR-DEV: Add the same secure password comparison method
ExpertSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password || !candidatePassword) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};


const Expert =
  mongoose.models.Expert || mongoose.model("Expert", ExpertSchema);

export default Expert;