/*
 * File: src/actions/expert-settings.js
 * SR-DEV: This is the "best-in-class" set of Server Actions
 * to handle all profile updates for an expert.
 */

"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import Expert from "@/models/Expert";
import { revalidatePath } from "next/cache";

/**
 * @description Helper function to get the authenticated expert
 * and their full DB profile in one go.
 */
async function getAuthenticatedExpert() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    throw new Error("Not authenticated.");
  }
  
  await connectToDatabase();
  const expert = await Expert.findById(session.user.id);
  
  if (!expert) {
    throw new Error("Expert profile not found.");
  }
  
  return { expert, session };
}

/**
 * @name updateExpertProfile
 * @description Updates the basic profile information for an expert.
 */
export async function updateExpertProfile(formData) {
  try {
    const { expert } = await getAuthenticatedExpert();

    // Extract and update profile fields
    expert.name = formData.get("name")?.toString().trim();
    expert.profilePicture = formData.get("profilePicture")?.toString().trim();
    expert.specialization = formData.get("specialization")?.toString().trim();
    expert.bio = formData.get("bio")?.toString().trim();
    expert.experienceYears = Number(formData.get("experienceYears"));
    expert.education = formData.get("education")?.toString().trim();
    expert.location = formData.get("location")?.toString().trim();
    
    // SR-DEV: THE FIX - Handle the "none" value for gender
    const genderValue = formData.get("gender")?.toString().trim();
    // Convert "none" back to an empty string for the database
    expert.gender = genderValue === "none" ? "" : genderValue;
    
    // SR-DEV: "Best-in-class" handling of string-to-array
    const languagesStr = formData.get("languages")?.toString() || "";
    expert.languages = languagesStr.split(',').map(s => s.trim()).filter(Boolean);
    
    const tagsStr = formData.get("tags")?.toString() || "";
    expert.tags = tagsStr.split(',').map(s => s.trim()).filter(Boolean);

    await expert.save();
    
    // SR-DEV: "Best-in-class" data revalidation.
    // This tells Next.js to re-fetch the data on the settings page.
    revalidatePath("/(app)/settings");
    
    return { success: true, message: "Profile updated successfully!" };

  } catch (error) {
    console.error("Server Action [updateExpertProfile] Error:", error);
    return { success: false, message: error.message || "Failed to update profile." };
  }
}

/**
 * @name updateExpertServices
 * @description Replaces the expert's entire list of services.
 */
export async function updateExpertServices(services) {
  try {
    const { expert } = await getAuthenticatedExpert();
    
    // SR-DEV: We receive a "clean" array of objects from the client.
    // We can just set it directly.
    expert.services = services;
    
    await expert.save();
    revalidatePath("/(app)/settings");
    
    return { success: true, message: "Services updated successfully!" };

  } catch (error) {
    console.error("Server Action [updateExpertServices] Error:", error);
    return { success: false, message: error.message || "Failed to update services." };
  }
}

/**
 * @name updateExpertAvailability
 * @description Replaces the expert's entire availability schedule.
 */
export async function updateExpertAvailability(availability) {
  try {
    const { expert } = await getAuthenticatedExpert();
    
    expert.availability = availability;
    
    await expert.save();
    revalidatePath("/(app)/settings");
    
    return { success: true, message: "Availability updated successfully!" };

  } catch (error) {
    console.error("Server Action [updateExpertAvailability] Error:", error);
    return { success: false, message: error.message || "Failed to update availability." };
  }
}

/**
 * @name updateExpertDocuments
 * @description Replaces the expert's entire list of documents.
 */
export async function updateExpertDocuments(documents) {
  try {
    const { expert } = await getAuthenticatedExpert();
    
    expert.documents = documents;
    
    await expert.save();
    revalidatePath("/(app)/settings");
    
    return { success: true, message: "Documents updated successfully!" };

  } catch (error) {
    console.error("Server Action [updateExpertDocuments] Error:", error);
    return { success: false, message: error.message || "Failed to update documents." };
  }
}