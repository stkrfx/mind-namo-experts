/*
 * File: src/app/(app)/AppointmentsClient.js
 * SR-DEV: This is the "best-in-industry" Client Component
 * for displaying the "Upcoming" vs. "Past" tabs
 * on the *Expert Dashboard*.
 * It's adapted from the user project.
 */

"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import ExpertAppointmentCard from "@/components/ExpertAppointmentCard"; // New card
import { Button } from "@/components/ui/button";
import Link from "next/link";

// --- Icons ---
const CalendarCheckIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /><path d="m9 16 2 2 4-4" />
  </svg>
);
const CalendarClockIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /><path d="M18 22a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" /><path d="M18 16.5V18" /><path d="M20.5 19.5 18 18" />
  </svg>
);
const CalendarIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);
// ---

export default function AppointmentsClient({ allAppointments }) {
  const [activeTab, setActiveTab] = useState("upcoming");

  const [upcomingAppointments, pastAppointments] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = [];
    const past = [];

    allAppointments.forEach(appt => {
      const apptDate = new Date(appt.appointmentDate);
      if (apptDate >= today && appt.status === 'confirmed') {
        upcoming.push(appt);
      } else {
        past.push(appt);
      }
    });
    
    upcoming.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

    return [upcoming, past];
  }, [allAppointments]);

  const appointmentsToShow = activeTab === "upcoming"
    ? upcomingAppointments
    : pastAppointments;

  return (
    <div className="bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-lg">
      {/* --- Tab Navigation --- */}
      <div className="border-b border-zinc-200 dark:border-zinc-700">
        <nav className="-mb-px flex space-x-6 p-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium",
              activeTab === "upcoming"
                ? "border-primary text-primary"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
            )}
          >
            <CalendarClockIcon className="h-5 w-5" />
            Upcoming ({upcomingAppointments.length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium",
              activeTab === "past"
                ? "border-primary text-primary"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
            )}
          >
            <CalendarCheckIcon className="h-5 w-5" />
            Past ({pastAppointments.length})
          </button>
        </nav>
      </div>

      {/* --- Appointment List --- */}
      <div className="space-y-0">
        {appointmentsToShow.length > 0 ? (
          appointmentsToShow.map((appt, index) => (
            <ExpertAppointmentCard 
              key={appt._id} 
              appointment={appt}
              isLast={index === appointmentsToShow.length - 1}
            />
          ))
        ) : (
          <EmptyState tab={activeTab} />
        )}
      </div>
    </div>
  );
}

const EmptyState = ({ tab }) => (
  <div className="flex flex-col items-center justify-center text-center p-12 min-h-[300px]">
    <CalendarIcon className="h-12 w-12 text-zinc-400" />
    <h3 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
      No {tab} appointments
    </h3>
    <p className="mt-1 text-zinc-500">
      {tab === "upcoming"
        ? "You don't have any upcoming appointments with clients."
        : "You haven't completed any appointments yet."}
    </p>
  </div>
);