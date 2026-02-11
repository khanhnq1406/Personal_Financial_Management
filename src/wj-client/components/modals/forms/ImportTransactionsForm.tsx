"use client";

import { useState } from "react";
import { BaseModal } from "@/components/modals/BaseModal";
import { FileUploadStep } from "@/components/import/FileUploadStep";
import { BankTemplateStep } from "@/components/import/BankTemplateStep";

interface ImportTransactionsFormProps {
  onSuccess?: () => void;
}

/**
 * Import Transactions Form - Multi-step wizard for importing bank/credit card statements
 *
 * Current implementation (Tasks 7-8):
 * - Step 1: File Upload (FileUploadStep)
 * - Step 2: Bank Template Selection (BankTemplateStep)
 * - Placeholder for future steps (Tasks 9-12)
 *
 * Future steps to be implemented:
 * - Step 3: Column Mapping Configuration (Task 9)
 * - Step 4: Preview & Validation (Task 10)
 * - Step 5: Import Execution (Task 11)
 * - Step 6: Success/Error Summary (Task 12)
 */
export function ImportTransactionsForm({ onSuccess }: ImportTransactionsFormProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleClose = () => {
    setIsOpen(false);
    onSuccess?.();
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };

  const handleTemplateSelected = (templateId: string | null) => {
    setSelectedTemplateId(templateId);
  };

  const handleStep1Next = () => {
    // Advance to bank template selection
    console.log("Step 1 complete - Selected file:", selectedFile?.name);
    setCurrentStep(2);
  };

  const handleStep2Back = () => {
    // Go back to file upload
    setCurrentStep(1);
  };

  const handleStep2Next = () => {
    // TODO: Task 9 - Implement column mapping step
    console.log("Step 2 complete - Selected template:", selectedTemplateId);
    console.log("Next: Column Mapping (to be implemented in Task 9)");
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
          onNext={handleStep1Next}
          isUploading={isUploading}
        />
      )}

      {/* Step 2: Bank Template Selection */}
      {currentStep === 2 && (
        <BankTemplateStep
          onTemplateSelected={handleTemplateSelected}
          onNext={handleStep2Next}
          onBack={handleStep2Back}
        />
      )}

      {/* Future steps will be added here in subsequent tasks */}
      {/* Step 3: Column Mapping (Task 9) */}
      {/* Step 4: Preview & Validation (Task 10) */}
      {/* Step 5: Import Execution (Task 11) */}
      {/* Step 6: Summary (Task 12) */}
    </BaseModal>
  );
}
