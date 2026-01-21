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
    <div className={cn("mb-2", className)}>
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
          "p-2 drop-shadow-round rounded-lg w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-hgreen focus-visible:ring-offset-2",
          error && "border-2 border-lred",
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
