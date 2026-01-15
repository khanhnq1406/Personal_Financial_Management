"use client";

import { useController, UseControllerProps } from "react-hook-form";
import { Label } from "./Label";
import { ErrorMessage } from "./ErrorMessage";

interface FormInputProps extends Omit<UseControllerProps, "control"> {
  control: any; // Control type causes generic issues with RHF, using any as workaround
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "text" | "email" | "tel";
}

export const FormInput = ({
  label,
  placeholder = "",
  required = false,
  disabled = false,
  className = "",
  type = "text",
  ...props
}: FormInputProps) => {
  const {
    field,
    fieldState: { error },
  } = useController(props);

  return (
    <div className={`mb-2 ${className}`}>
      <Label htmlFor={props.name} required={required}>
        {label}
      </Label>
      <input
        id={props.name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        {...field}
        className={`p-2 drop-shadow-round rounded-lg w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed ${
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
