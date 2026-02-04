import Image from "next/image";
import { resources } from "@/app/constants";
import { cn } from "@/lib/utils/cn";

type SelectDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
};

export function SelectDropdown({
  value,
  onChange,
  options,
  className = "",
  placeholder,
  "aria-label": ariaLabel,
}: SelectDropdownProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        name={ariaLabel?.toLowerCase().replace(/\s+/g, "-")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-neutral-50  rounded-lg px-4 py-2.5 pr-10 text-gray-900 text-sm font-bold drop-shadow-round cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus:border-primary-600 hover:border-primary-600/80"
        aria-label={ariaLabel}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Image
        src={`${resources}/down.png`}
        width={16}
        height={16}
        alt="Dropdown"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
      />
    </div>
  );
}
