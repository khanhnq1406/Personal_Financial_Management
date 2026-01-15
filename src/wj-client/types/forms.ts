/**
 * Form-specific type definitions
 */

import { WalletType } from "@/gen/protobuf/v1/wallet";

// Wallet form types
export interface CreateWalletFormData {
  walletName: string;
  initialBalance: number;
  type: WalletType;
}

// Transaction form types
export interface AddTransactionFormData {
  transactionType: "income" | "expense";
  amount: number;
  walletId: number;
  categoryId: number;
  date: number; // Unix timestamp
  note?: string;
}

// Transfer form types
export interface TransferMoneyFormData {
  amount: number;
  fromWalletId: number;
  toWalletId: number;
  datetime?: string;
  note?: string;
}

// Form submission handlers
export type FormSubmitHandler<T> = (data: T) => void | Promise<void>;

// Form state
export interface FormState<T> {
  data: T;
  errors: Record<keyof T, string | undefined>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Select option type
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

// Wallet with balance for display
export interface WalletWithBalance extends SelectOption {
  balance: number;
}

// Form configuration
export interface FormConfig {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  reValidateMode?: "onChange" | "onBlur" | "onSubmit";
  shouldFocusError?: boolean;
}
