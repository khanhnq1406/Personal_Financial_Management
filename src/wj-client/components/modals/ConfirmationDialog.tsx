"use client";

import { ButtonType } from "@/app/constants";
import { Button } from "@/components/Button";
import { ReactNode } from "react";
import { createPortal } from "react-dom";

export type ConfirmationDialogProps = {
  title?: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: "default" | "danger";
};

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
  variant = "default",
}) => {
  return createPortal(
    <div className="fixed top-0 left-0 w-full h-full bg-modal flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6">
        {title && (
          <div className="flex justify-between items-center mb-4">
            <div className="font-bold text-lg">{title}</div>
          </div>
        )}
        <div className="text-center mb-6 text-gray-700">{message}</div>
        <div className="flex gap-3 justify-end">
          <Button
            type={ButtonType.SECONDARY}
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type={ButtonType.PRIMARY}
            onClick={onConfirm}
            loading={isLoading}
            className={variant === "danger" ? "bg-danger-600 hover:bg-red-700" : ""}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
