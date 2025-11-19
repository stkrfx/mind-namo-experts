/*
 * File: src/models/Conversation.js
 * SR-DEV: Added lastMessageSender to track read status in the chat list.
 */

import mongoose, { Schema } from "mongoose";

const ConversationSchema = new Schema(
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
    lastMessage: {
      type: String,
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // SR-DEV: NEW FIELD - Needed to show ticks in the chat list
    lastMessageSender: {
      type: Schema.Types.ObjectId,
      refPath: "senderModel", // Optional dynamic ref, but ID is enough
    },
    userUnreadCount: { type: Number, default: 0 },
    expertUnreadCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: "conversations",
  }
);

ConversationSchema.index({ userId: 1, expertId: 1 }, { unique: true });

const Conversation =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", ConversationSchema);

export default Conversation;