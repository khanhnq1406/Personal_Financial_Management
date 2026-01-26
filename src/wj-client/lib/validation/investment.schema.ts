import { z } from "zod";
import { InvestmentType } from "@/gen/protobuf/v1/investment";

/**
 * Zod schema for investment creation
 */

const investmentTypeEnum = z.nativeEnum(InvestmentType);

export const createInvestmentSchema = z
  .object({
    symbol: z
      .string()
      .min(1, "Symbol is required")
      .max(20, "Symbol must be 20 characters or less"),
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less"),
    type: investmentTypeEnum,
    initialQuantity: z.number().min(0, "Quantity must be positive"),
    initialCost: z.number().min(0, "Initial cost must be 0 or greater"),
  })
  .refine(
    (data) => {
      return data.initialQuantity > 0;
    },
    { message: "Quantity must be greater than 0", path: ["initialQuantity"] },
  );

export type CreateInvestmentFormInput = z.infer<typeof createInvestmentSchema>;
