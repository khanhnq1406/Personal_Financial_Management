"use client";

import { ErrorMessage } from "./ErrorMessage";

/**
 * Example usage of the ErrorMessage component with different severity levels
 * This file demonstrates all three severity levels: error, warning, and info
 */
export function ErrorMessageExamples() {
  return (
    <div className="space-y-4 p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">
        ErrorMessage Component Examples
      </h2>

      {/* Error severity (default) */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-700 mb-2">Error</h3>
        <ErrorMessage severity="error">
          Invalid transaction amount. Please enter a positive number.
        </ErrorMessage>
      </div>

      {/* Warning severity */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-700 mb-2">
          Warning
        </h3>
        <ErrorMessage severity="warning">
          This wallet has a low balance. Consider transferring funds.
        </ErrorMessage>
      </div>

      {/* Info severity */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-700 mb-2">Info</h3>
        <ErrorMessage severity="info">
          Your market data was last updated 5 minutes ago.
        </ErrorMessage>
      </div>

      {/* Without explicit severity (defaults to error) */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-700 mb-2">
          Default (Error)
        </h3>
        <ErrorMessage>
          Failed to save wallet. Please try again.
        </ErrorMessage>
      </div>

      {/* Multiple lines of text */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-700 mb-2">
          Multi-line Error
        </h3>
        <ErrorMessage severity="error">
          Unable to process your investment transaction. This could be due to:
          insufficient funds, invalid symbol, or network issues. Please check
          your inputs and try again.
        </ErrorMessage>
      </div>

      {/* With custom className */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-700 mb-2">
          Custom Styling
        </h3>
        <ErrorMessage severity="info" className="mb-4">
          This message has custom margin bottom spacing applied.
        </ErrorMessage>
      </div>
    </div>
  );
}

/**
 * Usage in forms:
 *
 * // Simple error message
 * {error && <ErrorMessage>{error}</ErrorMessage>}
 *
 * // Warning message
 * {lowBalance && (
 *   <ErrorMessage severity="warning">
 *     Low balance warning message
 *   </ErrorMessage>
 * )}
 *
 * // Info message
 * <ErrorMessage severity="info">
 *   Additional information or help text
 * </ErrorMessage>
 *
 * // With ID for accessibility
 * <ErrorMessage id="email-error" severity="error">
 *   Invalid email format
 * </ErrorMessage>
 */
