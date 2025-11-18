/*
 * File: src/app/(app)/page.js
 * SR-DEV: This is the new "homepage" for logged-in experts.
 * As requested, this will be the dashboard to view appointments.
 *
 * This is a "best-in-class" Server Component that fetches
 * data and passes it to a client component for display.
 */

import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import Appointment from "@/models/Appointment";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AppointmentsClient from "./AppointmentsClient"; // New client component

// --- Icons ---
const Loader2Icon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);
// ---

const LoadingSpinner = () => (
  <div className="flex flex-1 items-center justify-center py-24">
    <Loader2Icon className="h-12 w-12 animate-spin text-primary" />
  </div>
);

/**
 * @description Securely fetches all appointments for a given *expert*.
 */
async function getAppointments(expertId) {
  try {
    await connectToDatabase();
    
    // SR-DEV: This is the "best-in-industry" query.
    // Find all appointments for this expert and sort them.
    const appointments = await Appointment.find({
      expertId: expertId
    })
    .sort({ appointmentDate: -1 }) // Newest first
    .lean();
    
    return JSON.parse(JSON.stringify(appointments));
  } catch (error) {
    console.error("Failed to fetch appointments:", error);
    return [];
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  // This page is protected by middleware, but we check
  // again just in case.
  if (!session || !session.user) {
    redirect("/login");
  }

  const allAppointments = await getAppointments(session.user.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          My Appointments
        </h1>
        <Link href="/settings">
          <Button variant="outline">Go to Settings</Button>
        </Link>
      </div>
      <Suspense fallback={<LoadingSpinner />}>
        <AppointmentsClient allAppointments={allAppointments} />
      </Suspense>
    </div>
  );
}