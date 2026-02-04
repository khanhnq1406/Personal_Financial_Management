"use client";

import { useController, UseControllerProps } from "react-hook-form";
import { Label } from "./Label";
import { ErrorMessage } from "./ErrorMessage";
import { cn } from "@/lib/utils/cn";

interface FormDateTimePickerProps extends Omit<UseControllerProps, "control"> {
  control: any; // Control type causes generic issues with RHF, using any as workaround
  label: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showTime?: boolean;
}

export const FormDateTimePicker = ({
  label,
  required = false,
  disabled = false,
  className = "",
  showTime = true,
  ...props
}: FormDateTimePickerProps) => {
  const {
    field: { onChange, onBlur, value, ref },
    fieldState: { error },
  } = useController(props);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const inputValue = value || "";

  return (
    <div className={cn("mb-2 sm:mb-3", className)}>
      <Label htmlFor={props.name} required={required}>
        {label}
      </Label>
      <input
        id={props.name}
        type={showTime ? "datetime-local" : "date"}
        disabled={disabled}
        value={inputValue}
        onChange={handleChange}
        onBlur={onBlur}
        ref={ref}
        className={cn(
          "border border-gray-300 rounded-md w-full text-base min-h-[44px] sm:min-h-[48px] p-2.5 sm:p-3 mt-1 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
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
