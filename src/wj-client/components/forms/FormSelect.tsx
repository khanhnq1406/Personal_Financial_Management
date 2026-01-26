"use client";

import { useController, UseControllerProps } from "react-hook-form";
import { Label } from "./Label";
import { ErrorMessage } from "./ErrorMessage";
import { cn } from "@/lib/utils/cn";
import { memo } from "react";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
  balance?: number;
}

interface FormSelectProps extends Omit<UseControllerProps, "control"> {
  control: any; // Control type causes generic issues with RHF, using any as workaround
  label: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  loading?: boolean;
  formatOption?: (option: SelectOption) => string;
}

export const FormSelect = memo(function FormSelect({
  label,
  options = [],
  placeholder = "Select an option",
  required = false,
  disabled = false,
  className = "",
  loading = false,
  formatOption,
  ...props
}: FormSelectProps) {
  const {
    field,
    fieldState: { error },
  } = useController(props);

  const formatLabel = (option: SelectOption): string => {
    if (formatOption) return formatOption(option);
    return option.label;
  };

  // Check if any option has a number value
  const hasNumberValues = options.some((opt) => typeof opt.value === "number");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    // Convert to number if options contain number values
    const parsedValue = hasNumberValues && value !== "" ? Number(value) : value;
    field.onChange(parsedValue);
  };

  return (
    <div className={cn("mb-2", className)}>
      <Label htmlFor={props.name} required={required}>
        {label}
      </Label>
      <select
        id={props.name}
        disabled={disabled || loading}
        value={field.value ?? ""}
        onChange={handleChange}
        onBlur={field.onBlur}
        name={field.name}
        ref={field.ref}
        className={cn(
          "p-2 drop-shadow-round rounded-lg w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-2 border-lred",
        )}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${props.name}-error` : undefined}
      >
        <option value="" disabled>
          {loading ? "Loading…" : placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {formatLabel(option)}
          </option>
        ))}
      </select>
      {error && (
        <ErrorMessage id={`${props.name}-error`}>{error.message}</ErrorMessage>
      )}
    </div>
  );
});
