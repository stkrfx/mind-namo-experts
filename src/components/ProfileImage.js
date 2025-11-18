/*
 * File: src/components/ProfileImage.js
 * SR-DEV: This component has been refactored with a
 * "best-in-class" fix for the hydration/reload bug.
 *
 * We now use a SINGLE `useEffect` hook that is dependent
 * on `[src]`. This one hook handles the initial mount,
 * cached images, and prop changes all at once,
 * which is simpler and more robust than the two-effect logic.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// ---
// SR-DEV: Color Hashing Logic (Unchanged)
// ---
const colorVariants = [
  { bg: "bg-red-500", text: "text-white" },
  { bg: "bg-green-500", text: "text-white" },
  { bg: "bg-blue-500", text: "text-white" },
  { bg: "bg-purple-500", text: "text-white" },
  { bg: "bg-pink-500", text: "text-white" },
  { bg: "bg-indigo-500", text: "text-white" },
  { bg: "bg-teal-500", text: "text-white" },
  { bg: "bg-orange-500", text: "text-white" },
  { bg: "bg-yellow-500", text: "text-zinc-900" },
  { bg: "bg-lime-500", text: "text-zinc-900" },
];

/**
 * @description Generates initials from a full name. (Unchanged)
 * @param {string} name - The user's full name (e.g., "Priya Sharma").
 * @returns {string} The initials (e.g., "PS").
 */
const getInitials = (name) => {
  if (!name) return "??";
  const names = name.split(" ");
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (
    names[0].charAt(0).toUpperCase() +
    names[names.length - 1].charAt(0).toUpperCase()
  );
};

/**
 * @description Hashes a name string to a consistent color. (Unchanged)
 * @param {string} name - The user's name.
 * @returns {{bg: string, text: string}} A color variant object.
 */
const getColor = (name) => {
  const nameStr = name || "Expert";
  let hash = 0;
  for (let i = 0; i < nameStr.length; i++) {
    hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash % colorVariants.length);
  return colorVariants[colorIndex];
};
// --- END COLOR LOGIC ---

/**
 * @description Renders a profile image, handling all states.
 * This is the fully optimized version.
 *
 * @param {object} props
 * @param {string} [props.src] - The URL of the image to display.
 * @param {string} props.name - The user's name (for alt text and initials).
 * @param {string} [props.sizeClass] - Tailwind classes for size (e.g., "h-10 w-10").
 * @param {string} [props.textClass] - Tailwind classes for text size (e.g., "text-lg").
 * @returns {React.ReactElement}
 */
export default function ProfileImage({
  src,
  name,
  sizeClass = "",
  textClass = "",
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const imgRef = useRef(null);

  // SR-DEV: Derive fallback UI values from the name prop.
  const { bg, text } = getColor(name);
  const initials = getInitials(name);

  // SR-DEV: THE "BEST-IN-CLASS" FIX (REFACTORED)
  // We now use a single, robust effect.
  useEffect(() => {
    if (!src) {
      // If src is null/undefined/"", go to fallback state.
      setImgSrc(null);
      setIsImageLoaded(true); // The fallback is considered "loaded"
      return;
    }

    // A valid `src` prop is provided.
    setImgSrc(src);

    // Check the image ref.
    if (imgRef.current) {
      // Check if the image is *already complete* (cached).
      if (imgRef.current.complete) {
        if (imgRef.current.naturalHeight > 0) {
          // It's cached and VALID, so show it.
          setIsImageLoaded(true);
        } else {
          // SR-DEV: THE FIX IS HERE
          // It's cached but BROKEN (e.g., 404).
          // Manually trigger the fallback state.
          setImgSrc(null);
          setIsImageLoaded(true);
        }
      } else {
        // It's not cached, or the ref is stale.
        // Set to loading and wait for `onLoad` or `onError`.
        setIsImageLoaded(false);
      }
    } else {
      // Ref isn't available yet, wait for `onLoad`.
      setIsImageLoaded(false);
    }
    // This effect now correctly handles the initial mount
    // AND any changes to the `src` prop.
  }, [src]);

  return (
    <div className={cn("relative flex-shrink-0 rounded-full", sizeClass)}>
      {imgSrc ? (
        // --- State 1: Image is provided ---
        <>
          <img
            ref={imgRef}
            src={imgSrc}
            alt={name}
            // SR-DEV: If the image fails to load, setSrc(null)
            // to trigger the fallback UI.
            onError={() => {
              setImgSrc(null);
              setIsImageLoaded(true); // Fallback is considered "loaded"
            }}
            // SR-DEV: On successful load, show the image.
            onLoad={() => setIsImageLoaded(true)}
            className={cn(
              "h-full w-full rounded-full object-cover transition-opacity",
              isImageLoaded ? "opacity-100" : "opacity-0" // Fade in
            )}
          />
          {/*
           * SR-DEV: The "Loading" state (skeleton)
           * This shows only when `imgSrc` exists but `isImageLoaded` is false.
           */}
          {!isImageLoaded && (
            <div className="absolute inset-0 h-full w-full animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
          )}
        </>
      ) : (
        // --- State 2: No Image (Fallback) ---
        // This renders if `imgSrc` is null (either from error or no prop).
        <div
          className={cn(
            "flex h-full w-full items-center justify-center rounded-full font-semibold",
            bg,
            text,
            textClass
          )}
        >
          {initials}
        </div>
      )}
    </div>
  );
}