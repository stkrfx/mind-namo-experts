/*
 * File: src/components/ExpertAppointmentCard.js
 * SR-DEV: This is a new "best-in-class" card for the
 * *expert's* dashboard, showing client information.
 */

"use client";

import { cn } from "@/lib/utils";

// --- Icons ---
const TagIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.414 2.414 0 0 0 3.414 0l7.172-7.172a2.414 2.414 0 0 0 0-3.414L12.586 2.586z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>
);
const ClockIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const VideoIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect width="15" height="14" x="1" y="5" rx="2" ry="2" /></svg>
);
const BuildingIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>
);
const UserIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
// ---

export default function ExpertAppointmentCard({ appointment, isLast }) {
  
  const appointmentDate = new Date(appointment.appointmentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const isUpcoming = appointmentDate >= today && appointment.status === 'confirmed';
  const isCompleted = appointmentDate < today || appointment.status === 'completed';
  const isCancelled = appointment.status === 'cancelled';
  
  const displayDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC', // Fix hydration mismatch
  });

  return (
    <div className={cn(
      "p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
      !isLast && "border-b border-zinc-200 dark:border-zinc-700"
    )}>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Client Info */}
        <div className="flex items-start gap-3">
          <UserIcon className="h-4 w-4 text-zinc-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-zinc-500">Client</p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {appointment.userName}
            </p>
          </div>
        </div>
        
        {/* Date/Time Info */}
        <div className="flex items-start gap-3">
          <ClockIcon className="h-4 w-4 text-zinc-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-zinc-500">When</p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {displayDate}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {appointment.appointmentTime} ({appointment.duration} min)
            </p>
          </div>
        </div>
        
        {/* Type/Service Info */}
        <div className="flex items-start gap-3">
          {appointment.appointmentType === "Video Call" ? (
            <VideoIcon className="h-4 w-4 text-zinc-500 flex-shrink-0 mt-0.5" />
          ) : (
            <BuildingIcon className="h-4 w-4 text-zinc-500 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-xs text-zinc-500">Service</p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {appointment.serviceName}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {appointment.appointmentType}
            </p>
          </div>
        </div>

      </div>

      <div className="flex-shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2">
        <div>
          <p className="text-xs text-zinc-500">Payout</p>
          <p className="text-lg font-bold text-green-600 text-right">₹{appointment.price}</p>
        </div>
        <span 
          className={cn(
            "text-xs font-bold uppercase px-3 py-1 rounded-full",
            isUpcoming && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
            isCompleted && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
            isCancelled && "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
          )}
        >
          {isUpcoming && "Upcoming"}
          {isCompleted && "Completed"}
          {isCancelled && "Cancelled"}
        </span>
      </div>
    </div>
  );
}