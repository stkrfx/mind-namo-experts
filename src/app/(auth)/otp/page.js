/*
 * File: src/app/(auth)/otp/page.js
 * SR-DEV: This is the expert OTP page.
 * It calls our new `resendExpertOtpAction`.
 */

"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// SR-DEV: CRITICAL - Import the new expert action
import { resendExpertOtpAction } from "@/actions/auth-expert";

const OtpPage = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isResending, startResendTransition] = useTransition();
  const [resendStatus, setResendStatus] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (!email) {
      router.push("/register");
    }
  }, [email, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResendMessage("");
    setResendStatus("");

    startTransition(async () => {
      // Calls the custom 'otp-credentials' provider
      const result = await signIn("otp-credentials", {
        redirect: false,
        email,
        otp,
      });

      if (result.error) {
        setError(result.error || "Invalid or expired OTP.");
      } else {
        // SR-DEV: "Best-in-class" UX. On success,
        // send the expert to their settings page to
        // complete their profile.
        router.push("/settings");
      }
    });
  };

  const handleResendOtp = () => {
    if (cooldown > 0 || isResending || !email) return;

    startResendTransition(async () => {
      setError("");
      setResendMessage("");
      setResendStatus("");

      // SR-DEV: Call the new expert-specific action
      const result = await resendExpertOtpAction(email);

      if (result.success) {
        setResendStatus("success");
        setResendMessage(result.message);
        setCooldown(60);
      } else {
        setResendStatus("error");
        setResendMessage(result.message);
      }
    });
  };

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      {/* --- Column 1: Branding/Image --- */}
      <div className="relative hidden h-full flex-col bg-zinc-900 p-10 text-white lg:flex">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1580281657516-524a35e83618?q=80&w=1920&auto=format&fit=crop"
            alt="A professional working at a desk"
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/1920x1080/18181b/9ca3af?text=Mind+Namo+Experts";
              e.currentTarget.alt = "Mind Namo placeholder image";
            }}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
        </div>
        <div className="relative z-20 flex items-center text-lg font-medium">
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
          Mind Namo Experts
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl">
              &ldquo;Your expertise, your schedule, your success. Welcome to the
              platform built for professionals like you.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>

      {/* --- Column 2: The Form --- */}
      <div className="flex items-center justify-center py-12 lg:h-screen lg:overflow-y-auto">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Verify Your Email</h1>
            <p className="text-balance text-muted-foreground">
              We've sent a 6-digit code to{" "}
              <strong className="text-foreground">{email}</strong>.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="grid gap-4">
            {error && (
              <p className="text-red-500 text-sm text-center font-medium">
                {error}
              </p>
            )}

            <div className="grid gap-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="------"
                maxLength={6}
                className="text-center text-2xl font-semibold tracking-[0.5em]"
                disabled={isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={isPending || otp.length < 6}
            >
              {isPending ? (
                <Loader2Icon className="h-5 w-5 animate-spin" />
              ) : null}
              {isPending ? "Verifying..." : "Verify & Continue"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {resendMessage && (
              <p
                className={`mb-2 text-sm font-medium ${
                  resendStatus === "success"
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {resendMessage}
              </p>
            )}

            <Button
              variant="link"
              className="p-0 h-auto font-medium text-primary"
              onClick={handleResendOtp}
              disabled={isResending || cooldown > 0}
            >
              {isResending
                ? "Sending code..."
                : cooldown > 0
                ? `Resend code in ${cooldown}s`
                : "Didn't get a code? Resend"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Loader2Icon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);

// SR-DEV: THE FIX - We must default export the component
export default OtpPage;