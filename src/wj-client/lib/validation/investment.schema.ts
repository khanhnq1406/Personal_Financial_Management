import { z } from "zod";
import {
  InvestmentTransactionType,
  InvestmentType,
} from "@/gen/protobuf/v1/investment";

/**
 * Zod schema for investment creation
 */

// Helper to coerce string to number for enum validation (FormSelect returns strings)
function coerceStringToEnum<T extends z.ZodNativeEnumEnumType>(
  enumType: T,
): z.ZodType<z.infer<ReturnType<typeof z.nativeEnum<typeof enumType>>>> {
  return z.preprocess((val) => {
    if (typeof val === "string") {
      const num = parseInt(val, 10);
      return isNaN(num) ? val : num;
    }
    return val;
  }, z.nativeEnum(enumType));
}

const investmentTypeEnum = coerceStringToEnum(InvestmentType);

export const createInvestmentSchema = z
  .object({
    symbol: z
      .string()
      .min(1, "Symbol is required")
      .max(20, "Symbol must be 20 characters or less")
      .refine(
        (val) => {
          // Allow uppercase alphanumeric, dots, hyphens, and underscores
          return /^[A-Za-z0-9._-]+$/.test(val);
        },
        {
          message:
            "Symbol should contain only letters, numbers, dots, underscores, and hyphens",
        },
      ),
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less"),
    type: investmentTypeEnum,
    initialQuantity: z.number().min(0.00000001, "Quantity must be positive"),
    initialCost: z.number().min(0, "Initial cost must be 0 or greater"),
    currency: z
      .string()
      .length(3, "Currency must be a 3-letter ISO code")
      .regex(/^[A-Z]{3}$/, "Currency must be 3 uppercase letters"),
  })
  .refine(
    (data) => {
      return data.initialQuantity > 0;
    },
    { message: "Quantity must be greater than 0", path: ["initialQuantity"] },
  );

const investmentTransactionTypeEnum = coerceStringToEnum(InvestmentTransactionType);

// Dynamic validation schema based on investment type (crypto vs others)
export const addTransactionSchema = z.object({
  type: investmentTransactionTypeEnum,
  quantity: z.number().min(0.00000001, "Quantity must be greater than 0"),
  price: z.number().min(0, "Price must be non-negative"),
  fees: z.number().min(0, "Fees must be non-negative"),
  transactionDate: z.string().min(1, "Transaction date is required"),
});

export type CreateInvestmentFormInput = z.infer<typeof createInvestmentSchema>;
export type AddTransactionFormInput = z.infer<typeof addTransactionSchema>;
