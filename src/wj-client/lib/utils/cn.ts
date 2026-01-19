import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to combine and conditionally apply Tailwind CSS classes.
 * Uses clsx for conditional class logic and tailwind-merge to resolve conflicts.
 *
 * @example
 * cn("px-2 py-1", "hover:bg-blue-500") // "px-2 py-1 hover:bg-blue-500"
 * cn("text-lg", isBold && "font-bold", className) // Merges with existing className prop
 *
 * @param inputs - Class values to merge (strings, arrays, objects, conditionals)
 * @returns Merged className string with Tailwind conflicts resolved
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
