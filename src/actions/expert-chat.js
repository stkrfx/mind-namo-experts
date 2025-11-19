/*
 * File: src/actions/expert-chat.js
 * SR-DEV: Server actions for the Expert side of the chat system.
 */

"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import User from "@/models/User"; // Ensure this model exists in your Expert app
import Expert from "@/models/Expert";

/**
 * @name getExpertConversations
 * @description Fetches the list of users who have chatted with this expert.
 */
export async function getExpertConversations() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return [];
  
  const expertId = session.user.id;

  try {
    await connectToDatabase();
    
    // Find conversations where this expert is the participant
    const conversations = await Conversation.find({ expertId: expertId })
      // Populate the USER details (name, pic) so the expert knows who they are talking to
      .populate('userId', 'name profilePicture email') 
      .sort({ lastMessageAt: -1 })
      .lean();
      
    return JSON.parse(JSON.stringify(conversations));
  } catch (error) {
    console.error("Server Action [getExpertConversations] Error:", error);
    return [];
  }
}

/**
 * @name getExpertMessages
 * @description Fetches messages for a specific conversation.
 */
export async function getExpertMessages(conversationId) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return [];
  const expertId = session.user.id;

  try {
    await connectToDatabase();
    
    // Security Check: Ensure this conversation belongs to this expert
    const conversation = await Conversation.findOne({
      _id: conversationId,
      expertId: expertId,
    });
    
    if (!conversation) return [];
    
    const messages = await Message.find({ conversationId: conversationId })
      .sort({ createdAt: 1 })
      .populate('replyTo')
      .lean();
      
    return JSON.parse(JSON.stringify(messages));
  } catch (error) {
    console.error("Server Action [getExpertMessages] Error:", error);
    return [];
  }
}