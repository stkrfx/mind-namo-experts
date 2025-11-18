/*
 * File: src/app/(app)/settings/page.js
 * SR-DEV: This is the "best-in-class" Server Component
 * for the "Settings" page.
 *
 * Its only job is to:
 * 1. Get the authenticated expert's session.
 * 2. Fetch the *full* expert document from the database.
 * 3. Pass this data to the <SettingsClient> component.
 */

import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import Expert from "@/models/Expert";
import SettingsClient from "./SettingsClient"; // Our new client component
import { Loader2Icon } from "lucide-react"; // Re-using from user project

// --- Icons ---
// SR-DEV: THE FIX - Removing the duplicate definition
/*
const Loader2Icon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);
*/
// ---

const LoadingSpinner = () => (
  <div className="flex flex-1 items-center justify-center py-24">
    <Loader2Icon className="h-12 w-12 animate-spin text-primary" />
  </div>
);

/**
 * @description Securely fetches the full expert profile.
 */
async function getExpertProfile(expertId) {
  try {
    await connectToDatabase();
    
    // SR-DEV: We find by ID. The session check protects this.
    const expert = await Expert.findById(expertId).lean();
    
    if (!expert) {
      return null;
    }
    
    // SR-DEV: "Best-in-class" serialization to pass
    // from Server to Client component.
    return JSON.parse(JSON.stringify(expert));
  } catch (error) {
    console.error("Failed to fetch expert profile:", error);
    return null;
  }
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  // This page is protected by middleware, but we double-check.
  if (!session || !session.user) {
    redirect("/login?callbackUrl=/settings");
  }

  // Fetch the full, up-to-date expert profile
  const expert = await getExpertProfile(session.user.id);

  if (!expert) {
    // This could happen if the DB record is deleted
    // but the session is still active.
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold text-red-600">
          Error: Expert profile not found.
        </h2>
        <p className="text-zinc-500 mt-2">
          Please log out and log back in.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">
        My Profile & Settings
      </h1>
      <Suspense fallback={<LoadingSpinner />}>
        {/*
         * SR-DEV: We pass the *full* expert object to the
         * client, which will manage all the forms and state.
         */}
        <SettingsClient expert={expert} />
      </Suspense>
    </div>
  );
}