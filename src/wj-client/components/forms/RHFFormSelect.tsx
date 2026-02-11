"use client";

import { useController, UseControllerProps } from "react-hook-form";
import { FormSelect, FormSelectProps } from "./FormSelect";

interface RHFFormSelectProps
  extends Omit<FormSelectProps, "error" | "value" | "onChange" | "name" | "defaultValue">,
    Omit<UseControllerProps, "control"> {
  control: any; // Control type causes generic issues with RHF, using any as workaround
  /**
   * If true, converts string values to numbers (useful for enum fields)
   */
  parseAsNumber?: boolean;
}

/**
 * React Hook Form compatible wrapper for FormSelect
 * Uses useController to integrate with react-hook-form
 */
export const RHFFormSelect = ({
  control,
  name,
  rules,
  shouldUnregister,
  defaultValue,
  disabled,
  parseAsNumber = false,
  ...selectProps
}: RHFFormSelectProps) => {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({
    name,
    control,
    rules,
    shouldUnregister,
    defaultValue,
    disabled,
  });

  const handleChange = (newValue: string) => {
    // Convert to number if needed (e.g., for enum fields)
    const parsedValue = parseAsNumber ? parseInt(newValue, 10) : newValue;
    onChange(parsedValue);
  };

  return (
    <FormSelect
      {...selectProps}
      value={String(value)}
      onChange={handleChange}
      error={error?.message}
      disabled={disabled}
    />
  );
};
