"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

// Hoist regex outside component to avoid recreating on each render (js-hoist-regexp)
const SPACE_REGEX = /\s+/g;

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode; // Optional custom footer (e.g., for confirmation dialogs)
  maxWidth?: string; // Optional max-width for the modal (e.g., "max-w-2xl", "max-w-3xl")
  maxHeight?: string; // Optional max-height for the modal (e.g., "max-h-2xl", "max-h-3xl")
}

/**
 * Simplified modal wrapper component with focus trap.
 * This is a "dumb" component that only provides modal behavior (backdrop, container, close button).
 * All form logic, mutation handling, and error handling is done by the child form components.
 */
export function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth,
  maxHeight,
}: BaseModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger animation after mount
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Focus trap: keep focus within modal when open
  useEffect(() => {
    if (!isOpen) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the modal container
    modalRef.current?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTabKey);

    return () => {
      document.removeEventListener("keydown", handleTabKey);
      // Restore focus to previous element when modal closes
      previousActiveElement.current?.focus();
    };
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  // Memoize modal title ID to avoid recalculating (rendering-hoist-jsx)
  const modalTitleId = useMemo(
    () => `modal-title-${title.replace(SPACE_REGEX, "-")}`,
    [title],
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with fade animation */}
      <div
        className={cn(
          "fixed inset-0 bg-modal z-40 transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container with slide/scale animation */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        tabIndex={-1}
        className={cn(
          "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4",
        )}
      >
        <div
          className={cn(
            "bg-white p-3 sm:p-5 rounded-t-xl sm:rounded-lg shadow-modal w-full overscroll-contain outline-none sm:mx-4",
            "transform transition-all duration-300 ease-out",
            isAnimating
              ? "translate-y-0 opacity-100"
              : "translate-y-8 sm:translate-y-0 opacity-0 sm:scale-95",
            maxWidth || "max-w-sm sm:max-w-md lg:max-w-lg",
            maxHeight || "max-h-[85vh] sm:max-h-[90vh]",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 id={modalTitleId} className="font-bold text-base sm:text-lg">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {children}

          {footer ? <div className="mt-3 sm:mt-4">{footer}</div> : null}
        </div>
      </div>
    </>
  );
}
