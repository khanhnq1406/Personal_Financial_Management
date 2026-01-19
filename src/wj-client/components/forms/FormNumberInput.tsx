"use client";

import { useController, UseControllerProps } from "react-hook-form";
import { Label } from "./Label";
import { ErrorMessage } from "./ErrorMessage";
import { cn } from "@/lib/utils/cn";

interface FormNumberInputProps extends Omit<UseControllerProps, "control"> {
  control: any; // Control type causes generic issues with RHF, using any as workaround
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  min?: number;
  max?: number;
  step?: string;
  prefix?: string;
  suffix?: string;
}

export const FormNumberInput = ({
  label,
  placeholder = "0",
  required = false,
  disabled = false,
  className = "",
  min,
  max,
  step = "1",
  prefix,
  suffix,
  ...props
}: FormNumberInputProps) => {
  const {
    field: { onChange, onBlur, value, ref },
    fieldState: { error },
  } = useController(props);

  // Handle change to ensure number type
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value);
    onChange(isNaN(numValue) ? "" : numValue);
  };

  return (
    <div className={cn("mb-2", className)}>
      <Label htmlFor={props.name} required={required}>
        {label}
      </Label>
      <div className="relative mt-1">
        {prefix && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
            {prefix}
          </span>
        )}
        <input
          id={props.name}
          type="number"
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          value={value ?? ""}
          onChange={handleChange}
          onBlur={onBlur}
          ref={ref}
          className={cn(
            "p-2 drop-shadow-round rounded-lg w-full disabled:opacity-50 disabled:cursor-not-allowed",
            prefix && "pl-8",
            suffix && "pr-12",
            error && "border-2 border-lred"
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${props.name}-error` : undefined}
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <ErrorMessage id={`${props.name}-error`}>{error.message}</ErrorMessage>
      )}
    </div>
  );
};
