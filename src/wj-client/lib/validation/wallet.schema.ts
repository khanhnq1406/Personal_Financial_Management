import { z } from "zod";
import { nameSchema } from "./common";
import { WalletType } from "@/gen/protobuf/v1/wallet";

/**
 * Zod schema for wallet creation
 * Includes async validation for wallet name uniqueness
 */

// Use native enum which handles both number and string values
// HTML select returns strings, but z.nativeEnum will validate and convert them
const walletTypeEnum = z.nativeEnum(WalletType);

// Schema with runtime wallet list for async validation
export const createWalletSchemaWithExisting = (existingWalletNames: string[]) =>
  z.object({
    walletName: nameSchema.refine(
      (name) => !existingWalletNames.includes(name),
      {
        message: "A wallet with this name already exists",
      },
    ),
    initialBalance: z.number(),
    type: walletTypeEnum,
  });

// Infer the form type from the schema
export type CreateWalletFormOutput = z.infer<
  ReturnType<typeof createWalletSchemaWithExisting>
>;

/**
 * Zod schema for wallet update
 * Only validates wallet name - balance updates are handled separately via AddFunds/WithdrawFunds
 */
export const updateWalletSchema = (
  existingWalletNames: string[],
  currentWalletName: string,
) =>
  z.object({
    walletName: nameSchema.refine(
      (name) =>
        !existingWalletNames.some(
          (existingName) =>
            existingName === name && existingName !== currentWalletName,
        ),
      {
        message: "A wallet with this name already exists",
      },
    ),
  });

// Infer the form type from the schema
export type UpdateWalletFormOutput = z.infer<
  ReturnType<typeof updateWalletSchema>
>;

/**
 * Zod schema for wallet balance adjustment
 * Amount must be positive, type determines add/remove
 */
export const adjustBalanceSchema = z.object({
  adjustmentAmount: z
    .number({
      message: "Amount must be a number",
    })
    .min(0.01, { message: "Adjustment amount must be at least 0.01" }),
  adjustmentType: z.enum(["add", "remove"], {
    message: "Please select whether to add or remove funds",
  }),
  reason: z
    .string()
    .max(200, "Reason must be less than 200 characters")
    .optional(),
});

// Infer the form type from the schema
export type AdjustBalanceFormOutput = z.infer<typeof adjustBalanceSchema>;
