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
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setIsOpen(false);
    onSuccess?.();
  };

  /**
   * Handle import errors with user-friendly messages and recovery logic
   */
  const handleImportError = (error: any) => {
    // Parse error message
    const errorMsg = error?.message || "Import failed";

    // Clear any existing errors first
    setError(null);

    // Recoverable errors - guide user to fix and retry
    if (errorMsg.includes("insufficient balance")) {
      setError("Wallet has insufficient balance for these transactions. Please adjust the transactions or choose a different wallet.");
      // Go back to review step when it's implemented (Task 10)
      // For now, stay on current step
    } else if (errorMsg.includes("exceeded maximum transactions per import")) {
      setError("File contains too many transactions (max 10,000). Please split into smaller files.");
      setCurrentStep(1); // Go back to file upload
    } else if (errorMsg.includes("transaction date cannot be in the future")) {
      setError("Some transactions have future dates. Please check your file and ensure all dates are valid.");
      setCurrentStep(1); // Go back to file upload
    } else if (errorMsg.includes("transaction date too old")) {
      setError("Some transactions are older than 10 years. Please remove old transactions and try again.");
      setCurrentStep(1); // Go back to file upload
    } else if (errorMsg.includes("No valid transactions to import")) {
      setError("No valid transactions found. Please check your file format and try again.");
      setCurrentStep(1); // Go back to file upload
    } else {
      setError("Import failed. Please try again or contact support if the problem persists.");
    }
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
    // TODO: Wire up handleImportError when import execution is implemented (Task 11)
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
      {/* Error Message Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

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
