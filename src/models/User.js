/*
 * File: src/models/User.js
 * SR-DEV: This file defines the Mongoose schema and model for our User.
 * It includes password hashing, comparison methods, and data validation.
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";

// SR-DEV: Hardcoding "magic numbers" like salt rounds is a security risk
// and bad practice. We pull this from environment variables.
// This allows security parameters to be changed without redeploying code.
const BCRYPT_SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '12', 10);

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
    },
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
      // SR-DEV: This is a critical performance optimization.
      // The users collection will be queried by email constantly (e.g., login).
      // An index is non-negotiable for a scalable application.
      index: true,
    },
    password: {
      type: String,
      // SR-DEV: This conditional 'required' logic is correct.
      required: function () {
        // Password is only required if this is not an OAuth user (no googleId)
        return !this.googleId;
      },
      minlength: [8, "Password must be at least 8 characters long."],
      // SR-DEV: Good. This prevents the hashed password from being sent
      // to the client in any query by default.
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
      // SR-DEV: Defaulting to null is cleaner than undefined.
      default: null,
    },
    otpExpires: {
      type: Date,
      select: false,
      default: null,
      // SR-DEV: Using 'sparse: true' is a great optimization here.
      // It means the index will only include documents that *have* this
      // field set (are not null). This is perfect for-background jobs
      // that clean up expired OTPs, as the query will be very efficient.
      index: true,
      sparse: true,
    },
    googleId: {
      type: String,
      unique: true,
      // SR-DEV: Correct. 'sparse' ensures the 'unique' constraint
      // only applies to documents that have a googleId, allowing
      // multiple users to have a 'null' value.
      sparse: true,
      default: null,
    },
  },
  {
    // SR-DEV: Explicitly setting the collection name is a best practice
    // to prevent Mongoose from auto-pluralizing and to ensure clarity.
    collection: "users",

    // SR-DEV: Per our discussion, timestamps are removed. If you need them
    // back, just add `timestamps: true` here.
  }
);

/**
 * @description Pre-Save Hook for Password Hashing
 * SR-DEV: This hook automatically hashes the password before saving a user,
 * but only if the password field has been modified.
 * This is the correct and secure way to handle password storage.
 */
UserSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  // and is not null/empty.
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  try {
    // Hash the password with the specified salt rounds
    this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
    next();
  } catch (error) {
    // Pass any errors to Mongoose
    next(error);
  }
});

/**
 * @description Instance Method to Compare Passwords
 * SR-DEV: This adds a '.comparePassword()' method to every User document.
 * It securely compares a candidate password against the stored hash.
 * @param {string} candidatePassword - The plain-text password to compare.
 * @returns {Promise<boolean>} - True if passwords match, false otherwise.
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  // If this user has no password (e.g., OAuth user) or no
  // candidate password was provided, return false.
  if (!this.password || !candidatePassword) {
    return false;
  }
  // Use bcrypt's built-in comparison to prevent timing attacks
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * SR-DEV: Model Export (Singleton Pattern for Next.js)
 * This is the correct pattern for Next.js/serverless environments.
 * It prevents the "OverwriteModelError" that occurs during
 * hot-reloading in development by reusing the existing model
 * if it has already been compiled.
 */
const User =
  mongoose.models.User || mongoose.model("User", UserSchema);

export default User;