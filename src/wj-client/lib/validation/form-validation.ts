/**
 * Form Validation Utilities
 * Provides reusable validators and validation rules for form inputs
 */

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Common validation rules
 */
export const ValidationRules = {
  /**
   * Email validation
   */
  email: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: "Please enter a valid email address",
  },

  /**
   * Phone validation (supports international formats)
   */
  phone: {
    pattern: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
    message: "Please enter a valid phone number",
  },

  /**
   * Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
   */
  password: {
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    message: "Password must be at least 8 characters with uppercase, lowercase, and number",
  },

  /**
   * Simple password (min 6 chars)
   */
  passwordSimple: {
    pattern: /^.{6,}$/,
    message: "Password must be at least 6 characters",
  },

  /**
   * Currency validation (positive number with optional decimals)
   */
  currency: {
    pattern: /^\d+\.?\d{0,2}$/,
    message: "Please enter a valid amount",
  },

  /**
   * Vietnamese currency (positive integer)
   */
  currencyVND: {
    pattern: /^\d+$/,
    message: "Please enter a valid amount (whole numbers only)",
  },

  /**
   * URL validation
   */
  url: {
    pattern: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
    message: "Please enter a valid URL",
  },

  /**
   * Number validation
   */
  number: {
    pattern: /^-?\d+(\.\d+)?$/,
    message: "Please enter a valid number",
  },

  /**
   * Positive number validation
   */
  positiveNumber: {
    pattern: /^\d+(\.\d+)?$/,
    message: "Please enter a positive number",
  },

  /**
   * Integer validation
   */
  integer: {
    pattern: /^-?\d+$/,
    message: "Please enter a whole number",
  },

  /**
   * Alphanumeric validation
   */
  alphanumeric: {
    pattern: /^[a-zA-Z0-9]+$/,
    message: "Only letters and numbers are allowed",
  },

  /**
   * Username validation (alphanumeric, underscore, hyphen)
   */
  username: {
    pattern: /^[a-zA-Z0-9_-]{3,20}$/,
    message: "Username must be 3-20 characters (letters, numbers, _, -)",
  },
};

/**
 * Validator functions
 */
export const Validators = {
  /**
   * Validate email
   */
  email: (value: string): boolean => {
    return ValidationRules.email.pattern.test(value);
  },

  /**
   * Validate phone number
   */
  phone: (value: string): boolean => {
    return ValidationRules.phone.pattern.test(value);
  },

  /**
   * Validate password
   */
  password: (value: string): boolean => {
    return ValidationRules.password.pattern.test(value);
  },

  /**
   * Validate simple password
   */
  passwordSimple: (value: string): boolean => {
    return ValidationRules.passwordSimple.pattern.test(value);
  },

  /**
   * Validate currency amount
   */
  currency: (value: string | number): boolean => {
    const strValue = String(value).trim();
    return ValidationRules.currency.pattern.test(strValue);
  },

  /**
   * Validate Vietnamese currency (integer)
   */
  currencyVND: (value: string | number): boolean => {
    const strValue = String(value).trim();
    return ValidationRules.currencyVND.pattern.test(strValue);
  },

  /**
   * Validate URL
   */
  url: (value: string): boolean => {
    return ValidationRules.url.pattern.test(value);
  },

  /**
   * Validate number
   */
  number: (value: string | number): boolean => {
    const strValue = String(value).trim();
    return ValidationRules.number.pattern.test(strValue);
  },

  /**
   * Validate positive number
   */
  positiveNumber: (value: string | number): boolean => {
    const strValue = String(value).trim();
    return ValidationRules.positiveNumber.pattern.test(strValue);
  },

  /**
   * Validate integer
   */
  integer: (value: string | number): boolean => {
    const strValue = String(value).trim();
    return ValidationRules.integer.pattern.test(strValue);
  },

  /**
   * Validate required field
   */
  required: (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },

  /**
   * Validate minimum length
   */
  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },

  /**
   * Validate maximum length
   */
  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  },

  /**
   * Validate minimum value
   */
  min: (value: number, min: number): boolean => {
    return value >= min;
  },

  /**
   * Validate maximum value
   */
  max: (value: number, max: number): boolean => {
    return value <= max;
  },

  /**
   * Validate range
   */
  range: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },

  /**
   * Validate pattern
   */
  pattern: (value: string, regex: RegExp): boolean => {
    return regex.test(value);
  },

  /**
   * Validate exact length
   */
  exactLength: (value: string, length: number): boolean => {
    return value.length === length;
  },

  /**
   * Validate matches another field (for password confirmation)
   */
  matches: (value: string, otherValue: string): boolean => {
    return value === otherValue;
  },
};

/**
 * Validation error messages
 */
export const ValidationMessages = {
  required: "This field is required",
  email: ValidationRules.email.message,
  phone: ValidationRules.phone.message,
  password: ValidationRules.password.message,
  passwordSimple: ValidationRules.passwordSimple.message,
  currency: ValidationRules.currency.message,
  currencyVND: ValidationRules.currencyVND.message,
  url: ValidationRules.url.message,
  number: "Please enter a valid number",
  positiveNumber: "Please enter a positive number",
  integer: "Please enter a whole number",
  minLength: (min: number) => `Minimum ${min} characters required`,
  maxLength: (max: number) => `Maximum ${max} characters allowed`,
  min: (min: number) => `Minimum value is ${min}`,
  max: (max: number) => `Maximum value is ${max}`,
  range: (min: number, max: number) => `Value must be between ${min} and ${max}`,
  exactLength: (length: number) => `Must be exactly ${length} characters`,
  matches: "Values do not match",
};

/**
 * Create a validation rule
 */
export function createRule(
  validate: (value: any) => boolean,
  message: string
): ValidationRule {
  return { validate, message };
}

/**
 * Create a required rule
 */
export function requiredRule(message?: string): ValidationRule {
  return createRule(
    (value) => Validators.required(value),
    message || ValidationMessages.required
  );
}

/**
 * Create an email rule
 */
export function emailRule(message?: string): ValidationRule {
  return createRule(
    (value) => Validators.email(value),
    message || ValidationMessages.email
  );
}

/**
 * Create a phone rule
 */
export function phoneRule(message?: string): ValidationRule {
  return createRule(
    (value) => Validators.phone(value),
    message || ValidationMessages.phone
  );
}

/**
 * Create a password rule
 */
export function passwordRule(strong: boolean = true, message?: string): ValidationRule {
  return createRule(
    (value) => strong ? Validators.password(value) : Validators.passwordSimple(value),
    message || (strong ? ValidationMessages.password : ValidationMessages.passwordSimple)
  );
}

/**
 * Create a min length rule
 */
export function minLengthRule(min: number, message?: string): ValidationRule {
  return createRule(
    (value) => Validators.minLength(value, min),
    message || ValidationMessages.minLength(min)
  );
}

/**
 * Create a max length rule
 */
export function maxLengthRule(max: number, message?: string): ValidationRule {
  return createRule(
    (value) => Validators.maxLength(value, max),
    message || ValidationMessages.maxLength(max)
  );
}

/**
 * Create a min value rule
 */
export function minRule(min: number, message?: string): ValidationRule {
  return createRule(
    (value) => Validators.min(Number(value), min),
    message || ValidationMessages.min(min)
  );
}

/**
 * Create a max value rule
 */
export function maxRule(max: number, message?: string): ValidationRule {
  return createRule(
    (value) => Validators.max(Number(value), max),
    message || ValidationMessages.max(max)
  );
}

/**
 * Create a pattern rule
 */
export function patternRule(pattern: RegExp, message?: string): ValidationRule {
  return createRule(
    (value) => Validators.pattern(value, pattern),
    message || "Invalid format"
  );
}

/**
 * Create a matches rule
 */
export function matchesRule(otherValue: any, message?: string): ValidationRule {
  return createRule(
    (value) => Validators.matches(value, otherValue),
    message || ValidationMessages.matches
  );
}

/**
 * Validate a single field against rules
 */
export function validateField(
  value: any,
  rules: ValidationRule[]
): string | null {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }
  return null;
}

/**
 * Validate a form schema
 */
export function validateForm(
  values: Record<string, any>,
  schema: Record<string, ValidationRule[]>
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [field, rules] of Object.entries(schema)) {
    const error = validateField(values[field], rules);
    if (error) {
      errors[field] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Type for form schema
 */
export type FormSchema<T extends Record<string, any>> = {
  [K in keyof T]?: ValidationRule[];
};

/**
 * Typed form validation
 */
export function validateFormTyped<T extends Record<string, any>>(
  values: T,
  schema: FormSchema<T>
): ValidationResult {
  return validateForm(values, schema as Record<string, ValidationRule[]>);
}

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  /**
   * Email field schema
   */
  email: [requiredRule(), emailRule()],

  /**
   * Password field schema
   */
  password: [requiredRule(), passwordRule(true)],

  /**
   * Simple password field schema
   */
  passwordSimple: [requiredRule(), passwordRule(false)],

  /**
   * Phone field schema
   */
  phone: [requiredRule(), phoneRule()],

  /**
   * Name field schema
   */
  name: [requiredRule(), minLengthRule(2), maxLengthRule(50)],

  /**
   * Currency field schema
   */
  currency: [requiredRule(), patternRule(ValidationRules.currency.pattern)],

  /**
   * Vietnamese currency field schema
   */
  currencyVND: [requiredRule(), patternRule(ValidationRules.currencyVND.pattern)],

  /**
   * Amount field schema
   */
  amount: [requiredRule(), patternRule(ValidationRules.positiveNumber.pattern)],
};

/**
 * Password strength checker
 */
export enum PasswordStrength {
  WEAK = "weak",
  FAIR = "fair",
  GOOD = "good",
  STRONG = "strong",
}

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number;
  feedback: string[];
}

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push("Use at least 8 characters");

  if (password.length >= 12) score += 1;

  // Lowercase check
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("Add lowercase letters");

  // Uppercase check
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("Add uppercase letters");

  // Number check
  if (/\d/.test(password)) score += 1;
  else feedback.push("Add numbers");

  // Special character check
  if (/[@$!%*?&]/.test(password)) score += 1;
  else feedback.push("Add special characters (@$!%*?&)");

  let strength: PasswordStrength;
  if (score <= 2) strength = PasswordStrength.WEAK;
  else if (score <= 3) strength = PasswordStrength.FAIR;
  else if (score <= 4) strength = PasswordStrength.GOOD;
  else strength = PasswordStrength.STRONG;

  return { strength, score, feedback };
}

/**
 * Format currency for validation
 */
export function formatCurrencyForValidation(value: string): string {
  // Remove all non-digit characters except decimal point
  return value.replace(/[^\d.]/g, "");
}

/**
 * Parse currency value to number
 */
export function parseCurrencyValue(value: string | number): number {
  if (typeof value === "number") return value;
  const formatted = formatCurrencyForValidation(value);
  return parseFloat(formatted) || 0;
}

/**
 * Format Vietnamese currency (no decimals)
 */
export function formatVNDCurrency(value: string | number): number {
  if (typeof value === "number") return Math.round(value);
  const formatted = value.replace(/[^\d]/g, "");
  return parseInt(formatted, 10) || 0;
}
