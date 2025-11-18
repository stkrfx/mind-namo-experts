/*
 * File: src/lib/utils.js
 * SR-DEV: This file is identical to the one in
 * mind-namo-users and is re-used here.
 */

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * @description A utility function to conditionally merge Tailwind CSS class names.
 */
export const cn = (...inputs) => {
  return twMerge(clsx(inputs));
};