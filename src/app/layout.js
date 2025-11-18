/*
 * File: src/app/layout.js
 * SR-DEV: This is the root layout for the *entire* app.
 * It's identical to the user project.
 */

import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Mind Namo Experts",
  description: "Manage your expert profile and appointments.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}