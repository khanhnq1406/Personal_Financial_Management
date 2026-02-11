"use client";

import { useState } from "react";
import { BaseModal } from "@/components/modals/BaseModal";
import { FileUploadStep } from "@/components/import/FileUploadStep";
import { WalletSelectionStep } from "@/components/import/WalletSelectionStep";
import { BankTemplateStep } from "@/components/import/BankTemplateStep";
import { ColumnMappingStep, ColumnMapping } from "@/components/import/ColumnMappingStep";
import { ReviewStepWrapper } from "@/components/import/ReviewStepWrapper";
import { ImportSuccess } from "@/components/import/ImportSuccess";
import { ImportSummary } from "@/gen/protobuf/v1/import";
import { useMutationUploadStatementFile } from "@/utils/generated/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { EVENT_TransactionListTransactions } from "@/utils/generated/hooks";

interface ImportTransactionsFormProps {
  onSuccess?: () => void;
}

/**
 * Import Transactions Form - Multi-step wizard for importing bank/credit card statements
 *
 * Complete implementation with 6 steps:
 * - Step 1: File Upload (FileUploadStep) ✓
 * - Step 2: Wallet Selection (WalletSelectionStep) ✓
 * - Step 3: Bank Template Selection (BankTemplateStep) ✓
 * - Step 4: Column Mapping Configuration (ColumnMappingStep) ✓
 * - Step 5: Preview, Review & Execute Import (ReviewStepWrapper) ✓
 * - Step 6: Success Summary with Undo Option (ImportSuccess) ✓
 *
 * Features:
 * - Multi-format support (CSV, Excel, PDF)
 * - Auto-detection of column mappings
 * - Category suggestions based on transaction description
 * - Duplicate detection
 * - Wallet balance updates
 * - Import undo functionality (24-hour window)
 */
export function ImportTransactionsForm({ onSuccess }: ImportTransactionsFormProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importBatchId, setImportBatchId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // File upload mutation
  const uploadFileMutation = useMutationUploadStatementFile({
    onSuccess: (response) => {
      if (response.success && response.fileId) {
        setUploadedFileId(response.fileId);
        setCurrentStep(2); // Move to wallet selection
      } else {
        setError(response.message || "Failed to upload file");
      }
    },
    onError: (err: any) => {
      setError(err.message || "Failed to upload file");
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    onSuccess?.();
  };

  const getModalTitle = () => {
    switch (currentStep) {
      case 1:
        return "Import Transactions - Upload File";
      case 2:
        return "Import Transactions - Select Wallet";
      case 3:
        return "Import Transactions - Bank Template";
      case 4:
        return "Import Transactions - Column Mapping";
      case 5:
        return "Import Transactions - Review";
      case 6:
        return "Import Complete";
      default:
        return "Import Transactions";
    }
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

  const handleWalletSelected = (walletId: number) => {
    setSelectedWalletId(walletId);
  };

  const handleTemplateSelected = (templateId: string | null) => {
    setSelectedTemplateId(templateId);
  };

  const handleStep1Next = async () => {
    if (!selectedFile) return;

    // Upload file to backend
    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileData = e.target?.result as ArrayBuffer;
      uploadFileMutation.mutate({
        fileData: new Uint8Array(fileData),
        fileName: selectedFile.name,
        fileType: selectedFile.name.split(".").pop() || "",
        fileSize: selectedFile.size,
      });
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleStep2Next = () => {
    setCurrentStep(3); // Move to bank template selection
  };

  const handleStep3Back = () => {
    setCurrentStep(2);
  };

  const handleStep3Next = () => {
    setCurrentStep(4); // Move to column mapping
  };

  const handleStep4Back = () => {
    setCurrentStep(3);
  };

  const handleColumnMappingComplete = (mapping: ColumnMapping) => {
    setColumnMapping(mapping);
    setCurrentStep(5); // Move to review
  };

  const handleStep5Back = () => {
    setCurrentStep(4);
  };

  const handleImportSuccess = (summary: ImportSummary, batchId: string) => {
    setImportSummary(summary);
    setImportBatchId(batchId);
    setCurrentStep(6); // Move to success screen
  };

  const handleDone = () => {
    // Refresh transaction list
    queryClient.invalidateQueries({ queryKey: [EVENT_TransactionListTransactions] });
    handleClose();
  };

  const handleUndoSuccess = () => {
    // Refresh and close
    queryClient.invalidateQueries({ queryKey: [EVENT_TransactionListTransactions] });
    handleClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle()}
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
          isUploading={uploadFileMutation.isPending}
        />
      )}

      {/* Step 2: Wallet Selection */}
      {currentStep === 2 && (
        <WalletSelectionStep
          onWalletSelected={handleWalletSelected}
          onNext={handleStep2Next}
          onBack={handleStep2Back}
        />
      )}

      {/* Step 3: Bank Template Selection */}
      {currentStep === 3 && (
        <BankTemplateStep
          onTemplateSelected={handleTemplateSelected}
          onNext={handleStep3Next}
          onBack={handleStep3Back}
        />
      )}

      {/* Step 4: Column Mapping */}
      {currentStep === 4 && selectedFile && (
        <ColumnMappingStep
          file={selectedFile}
          templateId={selectedTemplateId}
          onMappingComplete={handleColumnMappingComplete}
          onBack={handleStep4Back}
        />
      )}

      {/* Step 5: Review & Execute Import */}
      {currentStep === 5 &&
        selectedFile &&
        uploadedFileId &&
        selectedWalletId &&
        columnMapping && (
          <ReviewStepWrapper
            file={selectedFile}
            fileId={uploadedFileId}
            walletId={selectedWalletId}
            columnMapping={columnMapping}
            onImportSuccess={handleImportSuccess}
            onBack={handleStep5Back}
            onError={handleImportError}
          />
        )}

      {/* Step 6: Success Summary */}
      {currentStep === 6 && importSummary && importBatchId && (
        <ImportSuccess
          summary={importSummary}
          importBatchId={importBatchId}
          onDone={handleDone}
          onUndoSuccess={handleUndoSuccess}
        />
      )}
    </BaseModal>
  );
}
