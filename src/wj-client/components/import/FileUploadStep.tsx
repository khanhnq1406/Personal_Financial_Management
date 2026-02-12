"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/Button";

export interface FileUploadStepProps {
  onFileSelected: (file: File) => void;
  onNext: () => void;
  isUploading: boolean;
}

const ACCEPTED_FILE_TYPES = {
  "text/csv": [".csv"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/pdf": [".pdf"],
};

const MAX_FILE_SIZE = {
  csv: 10 * 1024 * 1024, // 10MB
  excel: 10 * 1024 * 1024, // 10MB
  pdf: 20 * 1024 * 1024, // 20MB
};

export function FileUploadStep({
  onFileSelected,
  onNext,
  isUploading,
}: FileUploadStepProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file type
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["csv", "xls", "xlsx", "pdf"].includes(ext)) {
      return "Invalid file type. Please upload CSV, Excel (.xlsx, .xls), or PDF file.";
    }

    // Check file size
    let maxSize = MAX_FILE_SIZE.csv;
    if (["xls", "xlsx"].includes(ext)) {
      maxSize = MAX_FILE_SIZE.excel;
    } else if (ext === "pdf") {
      maxSize = MAX_FILE_SIZE.pdf;
    }

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return `File size exceeds maximum ${maxSizeMB}MB limit.`;
    }

    if (file.size === 0) {
      return "File is empty.";
    }

    return null;
  };

  const handleFileChange = useCallback(
    (file: File | null) => {
      if (!file) {
        setSelectedFile(null);
        setError("");
        return;
      }

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
        return;
      }

      setError("");
      setSelectedFile(file);
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileChange(files[0]);
      }
    },
    [handleFileChange],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileChange(files[0]);
      }
    },
    [handleFileChange],
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Instructions */}
      <div className="text-sm sm:text-base text-neutral-600 dark:text-dark-text-secondary">
        <p className="mb-2">
          Upload your bank or credit card statement to import transactions.
        </p>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-dark-text-tertiary">
          Supported formats: CSV, Excel (.xlsx, .xls), PDF • Max size: 10MB
          (CSV/Excel), 20MB (PDF)
        </p>
      </div>

      {/* Drag & Drop Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-all duration-200",
          isDragOver
            ? "border-primary-500 bg-primary-50 dark:bg-primary-950 dark:border-primary-600"
            : selectedFile
              ? "border-success-500 bg-success-50 dark:bg-success-950 dark:border-success-600"
              : error
                ? "border-danger-500 bg-danger-50 dark:bg-danger-950 dark:border-danger-600"
                : "border-neutral-300 dark:border-dark-border hover:border-primary-400 dark:hover:border-primary-700 hover:bg-neutral-50 dark:hover:bg-dark-surface-hover",
          "cursor-pointer active:scale-[0.99]",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".csv,.xls,.xlsx,.pdf"
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Upload Icon */}
        <div className="mb-4">
          {selectedFile ? (
            <svg
              className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-success-600 dark:text-success-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-neutral-400 dark:text-dark-text-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          )}
        </div>

        {/* Text */}
        {selectedFile ? (
          <div>
            <p className="text-base sm:text-lg font-semibold text-success-700 dark:text-success-400 mb-1">
              {selectedFile.name}
            </p>
            <p className="text-sm text-neutral-600 dark:text-dark-text-secondary">
              {formatFileSize(selectedFile.size)} • Ready to upload
            </p>
          </div>
        ) : (
          <div>
            <p className="text-base sm:text-lg font-semibold text-neutral-700 dark:text-dark-text mb-2">
              Drop your file here, or{" "}
              <span className="text-primary-600 dark:text-primary-500">
                browse
              </span>
            </p>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-dark-text-tertiary">
              CSV, Excel, or PDF up to 20MB
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 sm:p-4 bg-danger-50 dark:bg-danger-950 border border-danger-200 dark:border-danger-800 rounded-lg">
          <svg
            className="w-5 h-5 text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-danger-700 dark:text-danger-300">
            {error}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {selectedFile && (
          <Button variant="secondary" onClick={() => handleFileChange(null)}>
            Clear
          </Button>
        )}
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!selectedFile || isUploading}
          loading={isUploading}
        >
          {isUploading ? "Uploading..." : "Next: Configure"}
        </Button>
      </div>
    </div>
  );
}
