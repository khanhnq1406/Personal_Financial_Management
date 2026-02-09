"use client";

import { useController, UseControllerProps } from "react-hook-form";
import { Label } from "./Label";
import { ErrorMessage } from "./ErrorMessage";
import { CreatableSelect } from "@/components/select/CreatableSelect";
import { cn } from "@/lib/utils/cn";

interface FormCreatableSelectProps extends Omit<UseControllerProps, "control"> {
  control: any; // Control type causes generic issues with RHF, using any as workaround
  label: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  loading?: boolean;
  onCreate?: (value: string) => Promise<void>;
}

export const FormCreatableSelect = ({
  label,
  options = [],
  placeholder = "Select or create...",
  required = false,
  disabled = false,
  className = "",
  loading = false,
  onCreate,
  ...props
}: FormCreatableSelectProps) => {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController(props);

  return (
    <div className={cn("mb-3 sm:mb-4", className)}>
      <Label htmlFor={props.name} required={required}>
        {label}
      </Label>
      <CreatableSelect
        options={options}
        value={value as string | undefined}
        onChange={onChange}
        onCreate={onCreate}
        placeholder={placeholder}
        disabled={disabled}
        isLoading={loading}
        className="mt-1 sm:mt-1.5"
      />
      {error && (
        <ErrorMessage id={`${props.name}-error`}>{error.message}</ErrorMessage>
      )}
    </div>
  );
};
