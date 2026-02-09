"use client";

import { cn } from "@/lib/utils/cn";
import React, { useState, useCallback } from "react";
import { ZIndex } from "@/lib/utils/z-index";
import { XIcon, PlusIcon } from "@/components/icons";

interface FABAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface FABProps {
  actions: FABAction[];
}

export function FloatingActionButton({ actions }: FABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleActionClick = useCallback(
    (
      event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
      action: FABAction,
    ) => {
      event.preventDefault();
      action.onClick();
      setIsOpen(false);
    },
    [],
  );

  return (
    <>
      {/* Backdrop when expanded */}
      <div
        className={cn(
          "fixed inset-0 bg-neutral-900/20 sm:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        style={{ zIndex: ZIndex.floating }}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* FAB Container - only visible on mobile */}
      <div
        className="fixed bottom-14 right-3 sm:hidden flex items-end"
        style={{ zIndex: ZIndex.floating + 1 }}
      >
        {/* Action buttons (expand upward) */}
        <div
          className={cn(
            "flex flex-col-reverse gap-3 mb-3 transition-all duration-300",
            isOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none",
          )}
        >
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={(event) => handleActionClick(event, action)}
              className={cn(
                "flex items-center gap-3 bg-white shadow-floating rounded-full",
                "px-4 py-3 min-h-[56px]",
                "hover:shadow-xl active:scale-95",
                "transition-all duration-200",
                "transform",
                "relative",
              )}
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : "0ms",
              }}
              aria-label={action.label}
            >
              <div className="flex-shrink-0 w-6 h-6 text-primary-600">
                {action.icon}
              </div>
              <span className="font-medium text-neutral-900 whitespace-nowrap pr-2">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Main FAB button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 bg-primary-600 text-white rounded-full shadow-floating",
            "flex items-center justify-center",
            "hover:bg-primary-700 hover:shadow-xl",
            "active:scale-95",
            "transition-all duration-200",
            isOpen && "rotate-45",
          )}
          aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
          aria-expanded={isOpen}
        >
          {isOpen ? <XIcon size="xl" className="text-white" decorative /> : <PlusIcon size="xl" className="text-white" decorative />}
        </button>
      </div>
    </>
  );
}

// Re-export for backward compatibility if needed
export default FloatingActionButton;
