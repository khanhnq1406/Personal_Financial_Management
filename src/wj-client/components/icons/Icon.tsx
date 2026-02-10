"use client";

import { memo } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Standard icon sizes for the design system
 */
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Props for the Icon base component
 */
export interface IconProps {
  /** Icon content (SVG path or element) */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Icon size preset */
  size?: IconSize;
  /** Custom width/height (overrides size prop) */
  width?: number | string;
  height?: number | string;
  /** Accessibility label */
  ariaLabel?: string;
  /** Whether the icon is decorative (no aria-label) */
  decorative?: boolean;
}

/**
 * Size presets mapping to Tailwind classes
 */
const sizeClasses: Record<IconSize, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

/**
 * Icon Base Component
 *
 * Provides standardized sizing and accessibility for all icons.
 * All icon components should wrap their SVG content with this component.
 *
 * @example
 * ```tsx
 * <Icon size="md" ariaLabel="Close">
 *   <svg {...standardSvgProps}>
 *     <path d="..." />
 *   </svg>
 * </Icon>
 * ```
 */
export const Icon = memo(function Icon({
  children,
  className,
  size = "md",
  width,
  height,
  ariaLabel,
  decorative = false,
}: IconProps) {
  const sizeClass = sizeClasses[size];
  const customSize = width && height ? { width, height } : {};

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "flex-shrink-0",
        sizeClass,
        className
      )}
      style={{
        ...customSize,
        minWidth: customSize.width || '12px',
        minHeight: customSize.height || '12px',
      }}
      aria-label={decorative ? undefined : ariaLabel}
      aria-hidden={decorative ? true : undefined}
      role="img"
    >
      {children}
    </span>
  );
}) as React.NamedExoticComponent<IconProps> & { displayName: string };

Icon.displayName = "Icon";

/**
 * Standard SVG props for all icon SVGs
 * Ensures consistent viewBox, fill, stroke settings
 */
export const standardSvgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  xmlns: "http://www.w3.org/2000/svg" as const,
};

export default Icon;
