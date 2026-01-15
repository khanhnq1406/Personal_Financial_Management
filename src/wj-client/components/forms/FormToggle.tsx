"use client";

import { useController, UseControllerProps } from "react-hook-form";

interface ToggleOption {
  value: string;
  label: string;
  className?: string;
}

interface FormToggleProps extends Omit<UseControllerProps, "control"> {
  control: any; // Control type causes generic issues with RHF, using any as workaround
  options: ToggleOption[];
  disabled?: boolean;
  className?: string;
}

export const FormToggle = ({
  options = [],
  disabled = false,
  className = "",
  ...props
}: FormToggleProps) => {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController(props);

  return (
    <div className={`mb-3 ${className}`}>
      <div className="text-sm font-medium mb-1">Transaction Type</div>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              value === option.value
                ? option.className || "bg-gray-800 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error && <div className="text-lred text-sm mt-1">{error.message}</div>}
    </div>
  );
};
