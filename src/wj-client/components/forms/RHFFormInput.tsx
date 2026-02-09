"use client";

import { useController, UseControllerProps } from "react-hook-form";
import { FormInput, FormInputProps } from "./FormInput";

interface RHFFormInputProps
  extends Omit<FormInputProps, "error" | "value" | "onChange" | "onBlur" | "name" | "defaultValue">,
    Omit<UseControllerProps, "control"> {
  control: any; // Control type causes generic issues with RHF, using any as workaround
}

/**
 * React Hook Form compatible wrapper for FormInput
 * Uses useController to integrate with react-hook-form
 */
export const RHFFormInput = ({
  control,
  name,
  rules,
  shouldUnregister,
  defaultValue,
  disabled,
  ...inputProps
}: RHFFormInputProps) => {
  const {
    field: { onChange, onBlur, value, ref },
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
    <FormInput
      {...inputProps}
      ref={ref}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={error?.message}
      disabled={disabled}
    />
  );
};
