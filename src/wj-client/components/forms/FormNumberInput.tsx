"use client";

import { useController, UseControllerProps } from "react-hook-form";
import { Label } from "./Label";
import { ErrorMessage } from "./ErrorMessage";
import { cn } from "@/lib/utils/cn";

interface FormNumberInputProps extends Omit<UseControllerProps, "control"> {
  control: any; // Control type causes generic issues with RHF, using any as workaround
  label?: string;
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
    <div className={cn("mb-2 sm:mb-3", className)}>
      {label && (
        <Label htmlFor={props.name} required={required}>
          {label}
        </Label>
      )}
      <div className={cn("relative", label && "mt-1")}>
        {prefix && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
            {prefix}
          </span>
        )}
        <input
          id={props.name}
          type="number"
          inputMode="decimal"
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
            "border border-gray-300 rounded-md w-full text-base min-h-[44px] sm:min-h-[48px] p-2.5 sm:p-3 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
            prefix && "pl-8",
            suffix && "pr-12",
            error && "border-2 border-danger-600"
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
