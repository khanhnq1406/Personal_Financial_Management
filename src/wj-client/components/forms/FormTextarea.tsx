"use client";

import { useController, UseControllerProps } from "react-hook-form";
import { Label } from "./Label";
import { ErrorMessage } from "./ErrorMessage";

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
    <div className={`mb-2 ${className}`}>
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
        className={`p-2 drop-shadow-round rounded-lg w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed resize-none ${
          error ? "border-2 border-lred" : ""
        }`}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${props.name}-error` : undefined}
      />
      {error && (
        <ErrorMessage id={`${props.name}-error`}>{error.message}</ErrorMessage>
      )}
    </div>
  );
};
