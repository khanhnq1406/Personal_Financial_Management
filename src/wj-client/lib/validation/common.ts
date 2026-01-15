import { z } from "zod";

/**
 * Common validation schemas used across multiple forms
 */

// Name validation (min 2 chars, max 50)
export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must not exceed 50 characters")
  .trim();

// Amount validation (positive number, 2 decimal places)
export const amountSchema = z
  .number({
    message: "Amount must be a number",
  })
  .positive("Amount must be positive")
  .min(0.01, "Amount must be at least 0.01")
  .max(999999999.99, "Amount exceeds maximum allowed");

// Date validation (Unix timestamp)
export const unixTimestampSchema = z
  .number({
    message: "Must be a valid date",
  })
  .int("Must be a valid timestamp")
  .positive("Date must be valid")
  .min(946684800, "Date must be after January 1, 2000") // Year 2000 minimum
  .max(4102444800, "Date must be before January 1, 2100"); // Year 2100 maximum

// Optional note validation
export const optionalNoteSchema = z
  .string()
  .max(500, "Note must not exceed 500 characters")
  .optional()
  .or(z.literal(""));

// Wallet ID validation
export const walletIdSchema = z
  .number({
    message: "Invalid wallet ID",
  })
  .int("Invalid wallet ID")
  .positive("Invalid wallet ID");

// Category ID validation
export const categoryIdSchema = z
  .number({
    message: "Invalid category ID",
  })
  .int("Invalid category ID")
  .positive("Invalid category ID");
