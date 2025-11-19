import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, required: true, refPath: "senderModel" },
    senderModel: { type: String, required: true, enum: ["User", "Expert"] },
    content: { type: String, required: true, trim: true },
    
    // SR-DEV: ADDED "pdf" to the enum
    contentType: {
      type: String,
      required: true,
      enum: ["text", "image", "audio", "pdf"], 
      default: "text",
    },
    
    replyTo: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    readBy: [{ type: Schema.Types.ObjectId, refPath: "senderModel" }],
  },
  { timestamps: true, collection: "messages" }
);

const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
export default Message;