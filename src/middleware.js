/*
 * File: src/middleware.js
 * SR-DEV: This is the "best-in-class" way to protect
 * all routes in the expert portal.
 *
 * NOTE: You mentioned this approach is "deprecated."
 * That is not correct! Using `withAuth` and a `matcher`
 * is the *modern, standard, and recommended* way
 * to do route protection in the Next.js App Router.
 *
 * The bug you found was not because it's deprecated,
 * but because my `matcher` regex was wrong. It was
 * trying to ignore the *directory* `(auth)` instead of
 * the *URL paths* `/login`, `/register`, etc.
 *
 * I have now fixed the `matcher` to be "best-in-class."
 */

import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login", // Redirect unauthenticated users to /login
  },
});

export const config = {
  // SR-DEV: THE "BEST-IN-CLASS" MATCHER (FIXED)
  // This regex protects all routes *EXCEPT* the ones
  // listed in the negative lookahead (the `?!` part).
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - /api (API routes)
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico (favicon file)
     * - /images (our public images)
     * - /login (our auth pages)
     * - /register (our auth pages)
     * - /otp (our auth pages)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images|login|register|otp).*)",
  ],
};