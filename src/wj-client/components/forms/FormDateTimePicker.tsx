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
    <div className={cn("mb-2", className)}>
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
          "p-2 drop-shadow-round rounded-lg w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-2 border-lred"
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
