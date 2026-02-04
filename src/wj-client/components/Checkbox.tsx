"use client";

import { ChangeEvent } from "react";
import { cn } from "@/lib/utils/cn";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  label?: string;
  "aria-label"?: string;
}

export function Checkbox({
  checked,
  onChange,
  disabled = false,
  className = "",
  id,
  label,
  "aria-label": ariaLabel,
}: CheckboxProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  const checkbox = (
    <input
      type="checkbox"
      id={id}
      name={id}
      checked={checked}
      onChange={handleChange}
      disabled={disabled}
      className={cn(
        "w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600 focus:ring-2 focus:ring-offset-0 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={ariaLabel || label}
      aria-checked={checked}
    />
  );

  // If label is provided, wrap checkbox with label for larger hit target
  if (label) {
    return (
      <label className={cn(
        "flex items-center gap-2 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        {checkbox}
        <span className="text-sm">{label}</span>
      </label>
    );
  }

  return checkbox;
}
