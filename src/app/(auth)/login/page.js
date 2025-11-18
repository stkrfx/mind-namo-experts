/*
 * File: src/app/(auth)/login/page.js
 * SR-DEV: This is the expert login page.
 * I have now added the "Sign in with Google" button.
 */

"use client";

import { useState, useTransition, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  // SR-DEV: "Best-in-class" redirect. After login,
  // send experts to their dashboard (the app root).
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    const authError = searchParams.get("error");
    if (authError) {
      if (authError === "CredentialsSignin") {
        setError("Invalid email or password.");
      } else if (authError.includes("Email not verified")) {
        // SR-DEV: Custom error from our NextAuth config
        const emailFromError = authError.split("=")[1];
        setError(
          <>
            Email not verified.{" "}
            <Link
              href={`/otp?email=${encodeURIComponent(emailFromError)}`}
              className="font-medium hover:underline text-primary"
            >
              Verify here.
            </Link>
          </>
        );
      } else {
        setError("An error occurred. Please try again.");
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (result.error) {
        // Handle custom "Email not verified" error
        if (result.error.includes("Email not verified")) {
          const emailFromError = result.error.split("=")[1];
          setError(
            <>
              Email not verified.{" "}
              <Link
                href={`/otp?email=${encodeURIComponent(emailFromError)}`}
                className="font-medium hover:underline text-primary"
              >
                Verify here.
              </Link>
            </>
          );
        } else {
          setError("Invalid email or password. Please try again.");
        }
      } else {
        router.push(callbackUrl);
      }
    });
  };

  // SR-DEV: THE FIX - Added Google Sign-In handler
  const handleGoogleSignIn = () => {
    startTransition(() => {
      signIn("google", { callbackUrl });
    });
  };

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
            <h1 className="text-3xl font-bold">Expert Portal Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email to access your dashboard.
            </p>
          </div>

          {/* SR-DEV: THE FIX - Added Google Button */}
          <Button
            onClick={handleGoogleSignIn}
            className="w-full gap-2"
            variant="outline"
            disabled={isPending}
          >
            <GoogleIcon className="h-5 w-5" />
            Sign in with Google
          </Button>

          {/* SR-DEV: THE FIX - Added "Or continue with" */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            {error && (
              <div className="text-red-500 text-sm text-center font-medium">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isPending}
                autoComplete="email"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="ml-auto inline-block text-sm font-medium hover:underline text-primary"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                  placeholder="********"
                  disabled={isPending}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-zinc-400 hover:text-zinc-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={isPending}>
              {isPending ? (
                <Loader2Icon className="h-5 w-5 animate-spin" />
              ) : null}
              {isPending ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Don&apos;t have an expert account?{" "}
            <Link href="/register" className="font-medium hover:underline text-primary">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- ICONS ---
const EyeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
const EyeOffIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
);
const Loader2Icon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);

// SR-DEV: THE FIX - Added Google Icon
const GoogleIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="48px"
    height="48px"
    {...props}
  >
    <path
      fill="#4285F4"
      d="M24 9.5c3.54 0 6.46 1.52 8.47 3.44l6.52-6.52C35.03 2.52 30.07 0 24 0 14.62 0 6.8 5.57 2.92 13.23l7.3 5.67C11.97 13.03 17.5 9.5 24 9.5z"
    />
    <path
      fill="#34A853"
      d="M46.18 24.55c0-1.54-.14-3.05-.4-4.5H24v8.51h12.44c-.54 2.77-2.08 5.12-4.4 6.7l7.14 5.5C43.14 36.6 46.18 31.08 46.18 24.55z"
    />
    <path
      fill="#FBBC05"
      d="M10.22 28.9C9.49 26.69 9.1 24.3 9.1 21.8s.39-4.89 1.12-7.1L2.92 9.03C1.06 13.16 0 17.35 0 21.8s1.06 8.64 2.92 12.77l7.3-5.67z"
    />
    <path
      fill="#EA4335"
      d="M24 43.6c6.43 0 11.8-2.13 15.75-5.75l-7.14-5.5c-2.1 1.4-4.78 2.23-7.61 2.23-6.5 0-12.03-3.53-14.08-8.56l-7.3 5.67C6.8 38.03 14.62 43.6 24 43.6z"
    />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);