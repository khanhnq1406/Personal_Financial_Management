import { z } from "zod";
import { nameSchema, amountSchema } from "./common";
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
      }
    ),
    initialBalance: amountSchema,
    type: walletTypeEnum,
  });

// Infer the form type from the schema
export type CreateWalletFormOutput = z.infer<
  ReturnType<typeof createWalletSchemaWithExisting>
>;
