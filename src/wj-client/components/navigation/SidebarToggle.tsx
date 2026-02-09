"use client";

import { cn } from "@/lib/utils/cn";
import { memo } from "react";

interface SidebarToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Toggle button for collapsing/expanding the sidebar
 * Uses chevron icons to indicate direction
 */
export const SidebarToggle = memo(function SidebarToggle({
  isExpanded,
  onToggle,
}: SidebarToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "hidden sm:flex items-center justify-center h-8 rounded-lg bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 transition-all touch-target duration-300 ease-in-out",
        isExpanded ? "w-full" : "w-8",
      )}
      aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      aria-expanded={isExpanded}
      title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
    >
      <svg
        className="w-5 h-5 text-white transition-transform duration-300 ease-in-out"
        style={{
          transform: isExpanded ? "rotate(0deg)" : "rotate(180deg)",
        }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
        />
      </svg>
    </button>
  );
});
