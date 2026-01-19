"use client";

import { ChangeEvent } from "react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Checkbox({
  checked,
  onChange,
  disabled = false,
  className = "",
  id,
}: CheckboxProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={handleChange}
      disabled={disabled}
      className={`w-5 h-5 rounded border-gray-300 text-bg focus:ring-bg focus:ring-2 focus:ring-offset-0 cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    />
  );
}
