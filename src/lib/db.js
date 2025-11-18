/*
 * File: src/lib/db.js
 * SR-DEV: This file is identical to the one in
 * mind-namo-users and is re-used here.
 */

import mongoose from "mongoose";

// 1. Define the URI and Mongoose connection options
const MONGO_URI = process.env.MONGO_URI;

const MONGOOSE_OPTS = {
  bufferCommands: false,
};

// 2. Check for the MONGO_URI
if (!MONGO_URI) {
  throw new Error(
    "Please define the MONGO_URI environment variable inside .env.local"
  );
}

/**
 * 3. Type-safe cache for our connection
 * @typedef {object} MongooseCache
 * @property {Promise<typeof mongoose> | null} promise
 * @property {typeof mongoose | null} conn
 */

/** @type {MongooseCache} */
let cached = globalThis.mongoose;

if (!cached) {
  cached = globalThis.mongoose = { conn: null, promise: null };
}

/**
 * 4. The main connection function
 */
export const connectToDatabase = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("Creating new Mongoose connection...");

    cached.promise = mongoose
      .connect(MONGO_URI, MONGOOSE_OPTS)
      .then((mongoose) => {
        console.log("Mongoose connection established.");
        return mongoose;
      })
      .catch((error) => {
        cached.promise = null;
        console.error("Mongoose connection failed:", error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }

  return cached.conn;
};