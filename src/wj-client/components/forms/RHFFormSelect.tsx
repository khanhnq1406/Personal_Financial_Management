"use client";

import { useController, UseControllerProps } from "react-hook-form";
import { FormSelect, FormSelectProps } from "./FormSelect";

interface RHFFormSelectProps
  extends Omit<FormSelectProps, "error" | "value" | "onChange" | "name" | "defaultValue">,
    Omit<UseControllerProps, "control"> {
  control: any; // Control type causes generic issues with RHF, using any as workaround
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

  return (
    <FormSelect
      {...selectProps}
      value={value}
      onChange={onChange}
      error={error?.message}
      disabled={disabled}
    />
  );
};
