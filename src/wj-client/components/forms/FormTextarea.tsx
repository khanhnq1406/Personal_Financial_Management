"use client";

import { useController, UseControllerProps } from "react-hook-form";
import { Label } from "./Label";
import { ErrorMessage } from "./ErrorMessage";
import { cn } from "@/lib/utils/cn";

interface FormTextareaProps extends Omit<UseControllerProps, "control"> {
  control: any; // Control type causes generic issues with RHF, using any as workaround
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  rows?: number;
  maxLength?: number;
  showCharacterCount?: boolean;
}

export const FormTextarea = ({
  label,
  placeholder = "",
  required = false,
  disabled = false,
  className = "",
  rows = 3,
  maxLength = 500,
  showCharacterCount = false,
  ...props
}: FormTextareaProps) => {
  const {
    field,
    fieldState: { error },
  } = useController(props);

  const currentLength = String(field.value || "").length;

  return (
    <div className={cn("mb-2 sm:mb-3", className)}>
      <Label htmlFor={props.name} required={required}>
        {label}
        {showCharacterCount && (
          <span className="text-xs text-gray-500 ml-2">
            {currentLength}/{maxLength}
          </span>
        )}
      </Label>
      <textarea
        id={props.name}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        {...field}
        className={cn(
          "border border-gray-300 rounded-md w-full text-base min-h-[44px] sm:min-h-[48px] p-2.5 sm:p-3 mt-1 resize-none outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-2 border-danger-600"
        )}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${props.name}-error` : undefined}
      />
      {error && (
        <ErrorMessage id={`${props.name}-error`}>{error.message}</ErrorMessage>
      )}
    </div>
  );
};
