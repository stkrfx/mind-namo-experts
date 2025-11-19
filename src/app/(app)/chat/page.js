/*
 * File: src/app/(app)/chat/page.js
 * SR-DEV: Expert Chat Page (Server Component)
 */

import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getExpertConversations } from "@/actions/expert-chat";
import ExpertChatClient from "./ExpertChatClient";

const Loader2Icon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);

const LoadingSpinner = () => (
  <div className="flex flex-1 items-center justify-center py-24">
    <Loader2Icon className="h-12 w-12 animate-spin text-primary" />
  </div>
);

export default async function ExpertChatPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login?callbackUrl=/chat");
  }

  const conversations = await getExpertConversations();

  return (
    // SR-DEV: Just return the client. Layout handles sizing now.
    <Suspense fallback={<LoadingSpinner />}>
      <ExpertChatClient 
        initialConversations={conversations} 
        currentExpert={session.user} 
      />
    </Suspense>
  );
}