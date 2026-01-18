"use client";

import { ButtonType } from "@/app/constants";
import { Button } from "@/components/Button";

export type ConfirmationDialogProps = {
  title?: string;
  message: string;
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
  return (
    <div>
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
          className={
            variant === "danger"
              ? "bg-lred hover:bg-red-700"
              : ""
          }
        >
          {confirmText}
        </Button>
      </div>
    </div>
  );
};
