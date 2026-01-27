"use client";

import { useEffect, useMemo, useRef } from "react";
import { ButtonType } from "@/app/constants";
import { Button } from "@/components/Button";
import { resources } from "@/app/constants";
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
    <div
      className="fixed top-0 left-0 w-full h-full bg-modal flex justify-center items-center z-50 overscroll-contain"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalTitleId}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          `bg-fg p-5 rounded-lg drop-shadow-round w-full overscroll-contain outline-none`,
          maxWidth || "max-w-md",
          maxHeight || "max-h-md",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id={modalTitleId} className="font-bold text-lg">
            {title}
          </h2>
          <Button
            type={ButtonType.IMG}
            src={`${resources}/close.png`}
            onClick={onClose}
            aria-label="Close modal"
          />
        </div>

        {children}

        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </div>
  );
}
