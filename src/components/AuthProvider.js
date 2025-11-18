/*
 * File: src/components/AuthProvider.js
 * SR-DEV: This file is identical to the one in
 * mind-namo-users and is re-used here.
 */

"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

export default function AuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}