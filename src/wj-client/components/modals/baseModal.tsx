"use client";

import { useEffect, useMemo } from "react";
import { ButtonType } from "@/app/constants";
import { Button } from "@/components/Button";
import { resources } from "@/app/constants";

// Hoist regex outside component to avoid recreating on each render (js-hoist-regexp)
const SPACE_REGEX = /\s+/g;

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode; // Optional custom footer (e.g., for confirmation dialogs)
}

/**
 * Simplified modal wrapper component.
 * This is a "dumb" component that only provides modal behavior (backdrop, container, close button).
 * All form logic, mutation handling, and error handling is done by the child form components.
 */
export function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: BaseModalProps) {
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
  const modalTitleId = useMemo(() => `modal-title-${title.replace(SPACE_REGEX, "-")}`, [title]);

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
        className="bg-fg p-5 rounded-lg drop-shadow-round max-w-md w-full mx-4 overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2
            id={modalTitleId}
            className="font-bold text-lg"
          >
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
