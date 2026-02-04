"use client";

import { useController, UseControllerProps } from "react-hook-form";
import { Label } from "./Label";
import { ErrorMessage } from "./ErrorMessage";
import { cn } from "@/lib/utils/cn";
import { memo } from "react";

interface FormInputProps extends Omit<UseControllerProps, "control"> {
  control: any; // Control type causes generic issues with RHF, using any as workaround
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "text" | "email" | "tel";
}

export const FormInput = memo(function FormInput({
  label,
  placeholder = "",
  required = false,
  disabled = false,
  className = "",
  type = "text",
  ...props
}: FormInputProps) {
  const {
    field,
    fieldState: { error },
  } = useController(props);

  return (
    <div className={cn("mb-2 sm:mb-3", className)}>
      <Label htmlFor={props.name} required={required}>
        {label}
      </Label>
      <input
        id={props.name}
        type={type}
        inputMode={type === "email" ? "email" : type === "tel" ? "tel" : "text"}
        placeholder={
          placeholder && placeholder.length > 0 ? `${placeholder}…` : ""
        }
        disabled={disabled}
        autoComplete={
          type === "email" ? "email" : type === "tel" ? "tel" : "off"
        }
        spellCheck={false}
        {...field}
        className={cn(
          "p-2.5 sm:p-3 drop-shadow-round rounded-lg w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 min-h-[44px] sm:min-h-[48px] text-base",
          // Light mode
          "bg-white text-neutral-900",
          // Dark mode
          "dark:bg-dark-surface dark:text-dark-text dark:focus-visible:ring-offset-dark-background",
          // Error state
          error && "border-2 border-danger-600 dark:border-danger-500",
          // Transitions
          "transition-colors duration-200",
        )}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${props.name}-error` : undefined}
      />
      {error && (
        <ErrorMessage id={`${props.name}-error`}>{error.message}</ErrorMessage>
      )}
    </div>
  );
});
