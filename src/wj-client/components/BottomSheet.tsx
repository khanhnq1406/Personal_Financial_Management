"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { ZIndex } from "@/lib/utils/z-index";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 dark:bg-black/70",
          "transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={handleBackdropClick}
        style={{ zIndex: ZIndex.modalBackdrop }}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 px-safe",
          "bg-white dark:bg-dark-surface",
          "rounded-t-3xl shadow-2xl dark:shadow-dark-modal",
          "max-h-[85vh] overflow-hidden",
          "pb-16 sm:pb-0", // Add padding for mobile nav bar (64px / 4rem)
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          zIndex: ZIndex.modal,
          willChange: isOpen ? "transform" : "auto",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-neutral-200 dark:border-dark-border">
          <h2
            id="bottom-sheet-title"
            className="text-lg font-semibold text-neutral-900 dark:text-dark-text"
          >
            {title}
          </h2>
        </div>

        {/* Content */}
        <div
          className="px-4 sm:px-0 overflow-y-auto max-h-[calc(85vh-144px)] sm:max-h-[calc(85vh-80px)] overscroll-contain"
          style={{
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
