/*
 * File: src/app/(app)/layout.js
 * SR-DEV: Expert App Layout
 *
 * FIX: Replaced 'h-screen' with 'h-[100dvh]' for mobile responsiveness.
 */

"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import ProfileImage from "@/components/ProfileImage"; 
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation"; 

// --- Icons ---
const LayoutDashboardIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
);
const SettingsIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
);
const LogOutIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
);
const MessageIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);

const navLinks = [
  { name: "Dashboard", href: "/", icon: <LayoutDashboardIcon /> },
  { name: "Chat", href: "/chat", icon: <MessageIcon /> },
  { name: "Settings", href: "/settings", icon: <SettingsIcon /> },
];

export default function AppLayout({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  
  const isChatPage = pathname?.startsWith("/chat");

  return (
    // SR-DEV: FIX - Use h-[100dvh] to handle mobile browser address bars correctly
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-4 border-b bg-white px-4 md:px-6 dark:bg-zinc-950 dark:border-zinc-800">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold md:text-base text-primary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-6 w-6"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            <span>Mind Namo Experts</span>
          </Link>
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 transition-colors hover:text-primary",
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {link.icon}
                {link.name}
              </Link>
            );
          })}
        </nav>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial"></div>
          {status === "authenticated" && session.user ? (
            <div className="relative">
              <ProfileImage
                src={session.user.image}
                name={session.user.name}
                sizeClass="h-9 w-9"
              />
            </div>
          ) : (
            <div className="h-9 w-9 rounded-full bg-zinc-200 animate-pulse" />
          )}
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            <LogOutIcon className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>
      
      <main className={cn(
        "flex flex-1 flex-col",
        isChatPage 
          ? "overflow-hidden p-0" 
          : "overflow-y-auto gap-4 p-4 md:gap-8 md:p-8" 
      )}>
        {children}
      </main>
    </div>
  );
}