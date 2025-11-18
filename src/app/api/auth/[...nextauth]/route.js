/*
 * File: src/app/api/auth/[...nextauth]/route.js
 * SR-DEV: This is the "best-in-class" NextAuth config
 * for the EXPERT portal. It authenticates against the
 * `Expert` collection, not the `User` collection.
 */

import NextAuth from "next-auth";
// SR-DEV: THE FIX - Import GoogleProvider
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/db";
// SR-DEV: CRITICAL - We import the Expert model here.
import Expert from "@/models/Expert";

export const authOptions = {
  // SR-DEV: We now support Google and Credentials
  providers: [
    // SR-DEV: THE FIX - Added GoogleProvider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    /**
     * SR-DEV: This is our "Password" provider for Experts.
     */
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectToDatabase();

        const expert = await Expert.findOne({ email: credentials.email }).select(
          "+password"
        );

        if (!expert) {
          throw new Error("Invalid credentials");
        }

        // SR-DEV: This is our new business rule.
        // An expert *must* be verified to log in.
        if (!expert.isVerified) {
          throw new Error(
            `Email not verified. Please check your email for the OTP. email=${credentials.email}`
          );
        }

        const isValid = await expert.comparePassword(credentials.password);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        // SR-DEV: Success. Return the expert object.
        return expert;
      },
    }),

    /**
     * SR-DEV: This is our "OTP" provider for Experts.
     */
    CredentialsProvider({
      id: "otp-credentials",
      name: "otp-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        await connectToDatabase();

        const expert = await Expert.findOne({
          email: credentials.email,
          otp: credentials.otp,
          otpExpires: { $gt: Date.now() },
        });

        if (!expert) {
          throw new Error("Invalid or expired OTP.");
        }

        // SR-DEV: Success! Consume the OTP and verify the expert.
        expert.isVerified = true;
        expert.otp = undefined;
        expert.otpExpires = undefined;
        await expert.save();

        return expert;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    /**
     * SR-DEV: THE FIX - Added the "best-in-class" signIn
     * callback to handle Google Auth and account linking.
     * This is our "manual adapter" for the Expert model.
     */
    async signIn({ user, account }) {
      // 1. For credentials/OTP, `authorize` already did the work.
      if (
        account.provider === "credentials" ||
        account.provider === "otp-credentials"
      ) {
        return true; // We trust 'authorize'
      }

      // 2. This is where we handle Google sign-in
      if (account.provider === "google") {
        await connectToDatabase();
        try {
          const { email, name, id: googleId, image } = user;

          const existingExpert = await Expert.findOne({ email: email });

          if (existingExpert) {
            // Expert exists. Link their Google account.
            if (!existingExpert.googleId) {
              existingExpert.googleId = googleId;
            }
            // If they signed up with Google, verify them
            existingExpert.isVerified = true;
            // Update profile picture if they don't have one
            if (!existingExpert.profilePicture && image) {
              existingExpert.profilePicture = image;
            }
            await existingExpert.save();
            
            // IMPORTANT: We must pass our *internal* DB ID to the JWT.
            user.id = existingExpert._id.toString();
            user.isVerified = existingExpert.isVerified;
            user.name = existingExpert.name;

          } else {
            // New expert. Create them using our Expert model.
            const newExpert = await Expert.create({
              email: email,
              name: name,
              googleId: googleId,
              profilePicture: image || "",
              isVerified: true, // Google emails are verified
              // 'password' is not required, per our schema logic
            });

            // Pass our *internal* DB ID to the JWT.
            user.id = newExpert._id.toString();
            user.isVerified = newExpert.isVerified;
          }

          return true; // Allow the sign-in
        } catch (error) {
          console.error("Error during Google sign-in persistence:", error);
          return false; // Prevent sign-in on DB error
        }
      }

      return false; // Default deny
    },

    /**
     * @description The 'jwt' callback.
     * The 'user' object it receives is the Mongoose document
     * from our `authorize()` functions.
     */
    async jwt({ token, user }) {
      // 'user' is only present on the initial sign-in.
      if (user) {
        token.id = user.id;
        token.isVerified = user.isVerified;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },

    /**
     * @description The 'session' callback transfers data
     * from the JWT to the client-side session object.
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.isVerified = token.isVerified;
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };