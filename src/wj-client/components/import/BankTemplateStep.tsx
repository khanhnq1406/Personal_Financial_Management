"use client";

import { useState } from "react";
import { useQueryListBankTemplates } from "@/utils/generated/hooks";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils/cn";

export interface BankTemplateStepProps {
  onTemplateSelected: (templateId: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export function BankTemplateStep({ onTemplateSelected, onNext, onBack }: BankTemplateStepProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const { data: templatesData, isLoading } = useQueryListBankTemplates({});

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    onTemplateSelected(templateId);
  };

  const handleCustomFormat = () => {
    setSelectedTemplate("custom");
    onTemplateSelected(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Instructions */}
      <div className="text-sm sm:text-base text-neutral-600 dark:text-dark-text-secondary">
        <p className="mb-2">Select your bank to automatically configure column mapping.</p>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-dark-text-tertiary">
          Or choose "Custom Format" to manually map columns.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-neutral-100 dark:bg-dark-surface-hover rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Bank Templates */}
      {!isLoading && (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto -mx-1 px-1">
          {templatesData?.templates?.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template.id)}
              className={cn(
                "w-full p-4 rounded-lg border-2 text-left transition-all duration-200",
                "hover:border-primary-400 hover:bg-neutral-50 dark:hover:bg-dark-surface-hover",
                "active:scale-[0.99]",
                selectedTemplate === template.id
                  ? "border-primary-600 bg-primary-50 dark:bg-primary-950 dark:border-primary-600"
                  : "border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-base text-neutral-900 dark:text-dark-text">
                    {template.name}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-dark-text-secondary mt-1">
                    {template.bankCode} • {template.statementType} • {template.fileFormats.join(", ")}
                  </p>
                </div>
                {selectedTemplate === template.id && (
                  <svg
                    className="w-6 h-6 text-primary-600 dark:text-primary-500 flex-shrink-0 ml-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          ))}

          {/* Custom Format Option */}
          <button
            onClick={handleCustomFormat}
            className={cn(
              "w-full p-4 rounded-lg border-2 text-left transition-all duration-200",
              "hover:border-primary-400 hover:bg-neutral-50 dark:hover:bg-dark-surface-hover",
              "active:scale-[0.99]",
              selectedTemplate === "custom"
                ? "border-primary-600 bg-primary-50 dark:bg-primary-950 dark:border-primary-600"
                : "border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-base text-neutral-900 dark:text-dark-text">
                  Custom Format
                </h3>
                <p className="text-sm text-neutral-600 dark:text-dark-text-secondary mt-1">
                  Manually configure column mapping for any bank
                </p>
              </div>
              {selectedTemplate === "custom" && (
                <svg
                  className="w-6 h-6 text-primary-600 dark:text-primary-500 flex-shrink-0 ml-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onBack} className="flex-1 sm:flex-initial">
          Back
        </Button>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!selectedTemplate}
          className="flex-1"
        >
          Next: Preview
        </Button>
      </div>
    </div>
  );
}
