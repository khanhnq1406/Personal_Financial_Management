"use client";

import { useController, UseControllerProps } from "react-hook-form";
import { Label } from "./Label";
import { ErrorMessage } from "./ErrorMessage";
import { cn } from "@/lib/utils/cn";
import { memo, useMemo } from "react";
import { Select } from "@/components/select/Select";

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
  disableFilter?: boolean;
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
  disableFilter,
  ...props
}: FormSelectProps) {
  const {
    field,
    fieldState: { error },
  } = useController(props);

  // Convert options to string-based Select options
  const selectOptions = useMemo(() => {
    return options.map((option) => ({
      value: String(option.value),
      label: formatOption ? formatOption(option) : option.label,
      disabled: option.disabled,
    }));
  }, [options, formatOption]);

  // Convert the current value to string for Select component
  const selectValue =
    field.value !== undefined && field.value !== ""
      ? String(field.value)
      : undefined;

  const handleChange = (value: string) => {
    // Convert back to number if original options had number values
    const hasNumberValues = options.some(
      (opt) => typeof opt.value === "number",
    );
    const parsedValue = hasNumberValues && value !== "" ? Number(value) : value;
    field.onChange(parsedValue);
  };

  return (
    <div className={cn("mb-2", className)}>
      <Label htmlFor={props.name} required={required}>
        {label}
      </Label>
      <Select
        options={selectOptions}
        value={selectValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled || loading}
        isLoading={loading}
        className={cn(
          "mt-1",
          error && "[&_input]:border-2 [&_input]:border-lred",
        )}
        disableFilter={disableFilter}
      />
      {error && (
        <ErrorMessage id={`${props.name}-error`}>{error.message}</ErrorMessage>
      )}
    </div>
  );
});
