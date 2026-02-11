package errors

import (
	"errors"
	"fmt"
	"strings"

	"gorm.io/gorm"
)

// UserFriendlyError wraps technical errors with user-friendly messages and suggestions.
type UserFriendlyError struct {
	TechnicalError error    // The original technical error
	UserMessage    string   // User-friendly message
	Suggestions    []string // Suggested actions for the user
	ErrorCode      string   // Machine-readable error code
}

// Error implements the error interface.
func (e *UserFriendlyError) Error() string {
	return e.UserMessage
}

// Unwrap returns the underlying error.
func (e *UserFriendlyError) Unwrap() error {
	return e.TechnicalError
}

// WrapWithUserMessage wraps common technical errors with user-friendly messages.
func WrapWithUserMessage(err error) error {
	if err == nil {
		return nil
	}

	// Check if already a UserFriendlyError
	var ufe *UserFriendlyError
	if errors.As(err, &ufe) {
		return err
	}

	// Database connection errors
	if strings.Contains(err.Error(), "connection") ||
		strings.Contains(err.Error(), "dial tcp") ||
		strings.Contains(err.Error(), "timeout") {
		return &UserFriendlyError{
			TechnicalError: err,
			UserMessage:    "Unable to connect to the database. Please try again in a few moments.",
			Suggestions: []string{
				"Check your internet connection",
				"Try refreshing the page",
				"Contact support if the problem persists",
			},
			ErrorCode: "DB_CONNECTION_ERROR",
		}
	}

	// GORM record not found
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return &UserFriendlyError{
			TechnicalError: err,
			UserMessage:    "The requested resource was not found.",
			Suggestions: []string{
				"Verify the ID is correct",
				"The resource may have been deleted",
				"Refresh the page to see the latest data",
			},
			ErrorCode: "RESOURCE_NOT_FOUND",
		}
	}

	// File parsing errors
	if strings.Contains(err.Error(), "parse") ||
		strings.Contains(err.Error(), "invalid format") ||
		strings.Contains(err.Error(), "corrupt") {
		return &UserFriendlyError{
			TechnicalError: err,
			UserMessage:    "Unable to read the uploaded file. The file may be corrupted or in an unsupported format.",
			Suggestions: []string{
				"Ensure the file is a valid CSV, Excel, or PDF",
				"Try exporting the file again from your bank",
				"Check that the file is not password-protected",
				"Verify the file is not corrupted",
			},
			ErrorCode: "FILE_PARSE_ERROR",
		}
	}

	// Empty file errors
	if strings.Contains(err.Error(), "empty") ||
		strings.Contains(err.Error(), "no data") ||
		strings.Contains(err.Error(), "no rows") {
		return &UserFriendlyError{
			TechnicalError: err,
			UserMessage:    "The uploaded file appears to be empty or contains no valid data.",
			Suggestions: []string{
				"Ensure the file contains transaction data",
				"Check that you selected the correct file",
				"Verify the file downloaded completely from your bank",
			},
			ErrorCode: "EMPTY_FILE_ERROR",
		}
	}

	// Insufficient balance
	if strings.Contains(err.Error(), "insufficient balance") ||
		strings.Contains(err.Error(), "balance cannot be negative") {
		return &UserFriendlyError{
			TechnicalError: err,
			UserMessage:    "This operation would result in a negative balance.",
			Suggestions: []string{
				"Check your current wallet balance",
				"Verify the transaction amounts are correct",
				"Consider transferring funds from another wallet first",
			},
			ErrorCode: "INSUFFICIENT_BALANCE",
		}
	}

	// Rate limit errors
	if strings.Contains(err.Error(), "rate limit") ||
		strings.Contains(err.Error(), "too many requests") {
		return &UserFriendlyError{
			TechnicalError: err,
			UserMessage:    "You've made too many import requests. Please wait a moment before trying again.",
			Suggestions: []string{
				"Wait a few minutes before trying again",
				"Consider importing fewer files at once",
			},
			ErrorCode: "RATE_LIMIT_EXCEEDED",
		}
	}

	// File size errors
	if strings.Contains(err.Error(), "file size") ||
		strings.Contains(err.Error(), "too large") {
		return &UserFriendlyError{
			TechnicalError: err,
			UserMessage:    "The uploaded file is too large.",
			Suggestions: []string{
				"Maximum file size: CSV/Excel 10MB, PDF 20MB",
				"Try splitting your statement into smaller date ranges",
				"Remove unnecessary columns from the file",
			},
			ErrorCode: "FILE_TOO_LARGE",
		}
	}

	// File type errors
	if strings.Contains(err.Error(), "file type") ||
		strings.Contains(err.Error(), "unsupported") {
		return &UserFriendlyError{
			TechnicalError: err,
			UserMessage:    "Unsupported file type. Please upload a CSV, Excel (.xlsx), or PDF file.",
			Suggestions: []string{
				"Supported formats: CSV, Excel (.xlsx, .xls), PDF",
				"Check the file extension is correct",
				"Try exporting in a different format from your bank",
			},
			ErrorCode: "UNSUPPORTED_FILE_TYPE",
		}
	}

	// Duplicate detection errors
	if strings.Contains(err.Error(), "duplicate") {
		return &UserFriendlyError{
			TechnicalError: err,
			UserMessage:    "Some transactions may already exist in your wallet.",
			Suggestions: []string{
				"Review the duplicate detection results",
				"Choose how to handle duplicates (skip, merge, or import all)",
			},
			ErrorCode: "DUPLICATE_DETECTED",
		}
	}

	// Currency conversion errors
	if strings.Contains(err.Error(), "exchange rate") ||
		strings.Contains(err.Error(), "currency") {
		return &UserFriendlyError{
			TechnicalError: err,
			UserMessage:    "Unable to retrieve exchange rates for currency conversion.",
			Suggestions: []string{
				"Try again in a few moments",
				"You can manually specify exchange rates",
				"Check your internet connection",
			},
			ErrorCode: "EXCHANGE_RATE_ERROR",
		}
	}

	// Validation errors - already have good messages
	var validationErr *ValidationError
	if errors.As(err, &validationErr) {
		return &UserFriendlyError{
			TechnicalError: err,
			UserMessage:    validationErr.Error(),
			Suggestions: []string{
				"Check the input values are correct",
				"Review the error message for details",
			},
			ErrorCode: "VALIDATION_ERROR",
		}
	}

	// Default: return error as-is for unknown types
	return err
}

// WrapErrorWithContext wraps an error with additional context.
func WrapErrorWithContext(err error, context string) error {
	if err == nil {
		return nil
	}

	wrapped := WrapWithUserMessage(err)

	var ufe *UserFriendlyError
	if errors.As(wrapped, &ufe) {
		// Add context to the message
		ufe.UserMessage = fmt.Sprintf("%s: %s", context, ufe.UserMessage)
		return ufe
	}

	// Return wrapped error
	return fmt.Errorf("%s: %w", context, wrapped)
}

// GetUserFriendlyMessage extracts a user-friendly message from any error.
func GetUserFriendlyMessage(err error) string {
	if err == nil {
		return ""
	}

	var ufe *UserFriendlyError
	if errors.As(err, &ufe) {
		return ufe.UserMessage
	}

	// Fall back to error message
	return err.Error()
}

// GetErrorSuggestions extracts suggestions from a UserFriendlyError.
func GetErrorSuggestions(err error) []string {
	if err == nil {
		return nil
	}

	var ufe *UserFriendlyError
	if errors.As(err, &ufe) {
		return ufe.Suggestions
	}

	return nil
}

// GetUserErrorCode extracts the error code from a UserFriendlyError.
func GetUserErrorCode(err error) string {
	if err == nil {
		return ""
	}

	var ufe *UserFriendlyError
	if errors.As(err, &ufe) {
		return ufe.ErrorCode
	}

	return "UNKNOWN_ERROR"
}
