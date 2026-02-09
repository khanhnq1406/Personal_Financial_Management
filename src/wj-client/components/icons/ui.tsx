"use client";

import { memo } from "react";
import { Icon, standardSvgProps, type IconProps } from "./Icon";

// Export individual icon components

export const CheckIcon = memo(function CheckIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Check"}>
      <svg {...standardSvgProps}>
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </Icon>
  );
});

export const XIcon = memo(function XIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Close"}>
      <svg {...standardSvgProps}>
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </Icon>
  );
});

export const ChevronDownIcon = memo(function ChevronDownIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Expand"}>
      <svg {...standardSvgProps}>
        <path d="M6 9l6 6 6-6" />
      </svg>
    </Icon>
  );
});

export const ChevronLeftIcon = memo(function ChevronLeftIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Back"}>
      <svg {...standardSvgProps}>
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </Icon>
  );
});

export const ChevronRightIcon = memo(function ChevronRightIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Next"}>
      <svg {...standardSvgProps}>
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Icon>
  );
});

export const PlusIcon = memo(function PlusIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Add"}>
      <svg {...standardSvgProps}>
        <path d="M12 4v16m8-8H4" />
      </svg>
    </Icon>
  );
});

export const MinusIcon = memo(function MinusIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Remove"}>
      <svg {...standardSvgProps}>
        <path d="M20 12H4" />
      </svg>
    </Icon>
  );
});

export const SearchIcon = memo(function SearchIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Search"}>
      <svg {...standardSvgProps}>
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    </Icon>
  );
});

export const RefreshIcon = memo(function RefreshIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Refresh"}>
      <svg {...standardSvgProps}>
        <path d="M23 4v6h-6M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
      </svg>
    </Icon>
  );
});

export const LoadingSpinnerIcon = memo(function LoadingSpinnerIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel="Loading" decorative={true}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </Icon>
  );
});

export const SunIcon = memo(function SunIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Light theme"}>
      <svg {...standardSvgProps}>
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    </Icon>
  );
});

export const MoonIcon = memo(function MoonIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Dark theme"}>
      <svg {...standardSvgProps}>
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    </Icon>
  );
});

export const DesktopIcon = memo(function DesktopIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "System theme"}>
      <svg {...standardSvgProps}>
        <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </Icon>
  );
});

export const AlertTriangleIcon = memo(function AlertTriangleIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Warning"}>
      <svg {...standardSvgProps}>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
      </svg>
    </Icon>
  );
});

export const InfoIcon = memo(function InfoIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Information"}>
      <svg {...standardSvgProps}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    </Icon>
  );
});
