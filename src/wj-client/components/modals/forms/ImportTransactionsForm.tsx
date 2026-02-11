"use client";

import { useState } from "react";
import { BaseModal } from "@/components/modals/BaseModal";
import { FileUploadStep } from "@/components/import/FileUploadStep";

interface ImportTransactionsFormProps {
  onSuccess?: () => void;
}

/**
 * Import Transactions Form - Multi-step wizard for importing bank/credit card statements
 *
 * Current implementation (Task 7):
 * - Step 1: File Upload (FileUploadStep)
 * - Placeholder for future steps (Tasks 8-12)
 *
 * Future steps to be implemented:
 * - Step 2: Bank Template Selection (Task 8)
 * - Step 3: Column Mapping Configuration (Task 9)
 * - Step 4: Preview & Validation (Task 10)
 * - Step 5: Import Execution (Task 11)
 * - Step 6: Success/Error Summary (Task 12)
 */
export function ImportTransactionsForm({ onSuccess }: ImportTransactionsFormProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleClose = () => {
    setIsOpen(false);
    onSuccess?.();
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };

  const handleNext = () => {
    // TODO: Task 8 - Implement bank template selection step
    // For now, just log that the user clicked next
    console.log("Next step - to be implemented in Task 8");
    console.log("Selected file:", selectedFile?.name);

    // In future tasks, this will advance to the next step:
    // setCurrentStep(2);
    // setIsUploading(true);
    // await uploadFile(selectedFile);
    // setIsUploading(false);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Transactions"
      maxWidth="max-w-2xl"
    >
      {/* Step 1: File Upload */}
      {currentStep === 1 && (
        <FileUploadStep
          onFileSelected={handleFileSelected}
          onNext={handleNext}
          isUploading={isUploading}
        />
      )}

      {/* Future steps will be added here in subsequent tasks */}
      {/* Step 2: Bank Template Selection (Task 8) */}
      {/* Step 3: Column Mapping (Task 9) */}
      {/* Step 4: Preview & Validation (Task 10) */}
      {/* Step 5: Import Execution (Task 11) */}
      {/* Step 6: Summary (Task 12) */}
    </BaseModal>
  );
}
