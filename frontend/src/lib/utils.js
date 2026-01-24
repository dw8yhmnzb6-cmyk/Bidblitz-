import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Parse API error and return user-friendly German message
 * This helps avoid showing raw "Not Found" or technical errors to users
 */
export function getErrorMessage(error, fallback = 'Ein Fehler ist aufgetreten') {
  const detail = error?.response?.data?.detail;
  
  if (!detail) return fallback;
  
  // Skip showing these specific errors as toasts (they're not user-actionable)
  const silentErrors = [
    'not found',
    'Not found',
    'NOT FOUND',
    'User not found',
    'user not found'
  ];
  
  if (silentErrors.some(e => detail.includes(e))) {
    return null; // Return null to indicate "don't show toast"
  }
  
  return detail;
}
