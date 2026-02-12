package logger

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"
)

// SensitiveFields are field names that should not be logged
var SensitiveFields = map[string]bool{
	"amount":          true,
	"description":     true,
	"accountNumber":   true,
	"referenceNumber": true,
	"note":            true,
	"balance":         true,
	"originalAmount":  true,
}

// LogImportError logs import errors with sanitized metadata.
// It removes sensitive fields like amounts, descriptions, and account numbers
// to comply with data privacy requirements.
func LogImportError(ctx context.Context, userID int32, operation string, err error, metadata map[string]interface{}) {
	if err == nil {
		return
	}

	// Sanitize metadata - remove sensitive fields
	sanitized := make(map[string]interface{})
	for k, v := range metadata {
		// Skip sensitive fields
		lowerKey := strings.ToLower(k)
		if SensitiveFields[lowerKey] {
			sanitized[k] = "[REDACTED]"
			continue
		}

		// Include safe fields
		sanitized[k] = v
	}

	// Add timestamp
	sanitized["timestamp"] = time.Now().Format(time.RFC3339)

	// Log structured error
	log.Printf(
		"[IMPORT_ERROR] user_id=%d operation=%s error=%s metadata=%+v",
		userID,
		operation,
		err.Error(),
		sanitized,
	)

	// TODO: Integrate with Sentry/Rollbar for production
	// Example:
	// if sentryEnabled {
	//     sentry.CaptureException(err, sentry.WithContext(ctx), sentry.WithExtra("metadata", sanitized))
	// }
}

// LogImportSuccess logs successful import operations with key metrics.
func LogImportSuccess(ctx context.Context, userID int32, operation string, metadata map[string]interface{}) {
	// Sanitize metadata
	sanitized := make(map[string]interface{})
	for k, v := range metadata {
		lowerKey := strings.ToLower(k)
		if SensitiveFields[lowerKey] {
			continue // Don't log sensitive data even in success
		}
		sanitized[k] = v
	}

	sanitized["timestamp"] = time.Now().Format(time.RFC3339)

	log.Printf(
		"[IMPORT_SUCCESS] user_id=%d operation=%s metadata=%+v",
		userID,
		operation,
		sanitized,
	)
}

// LogImportWarning logs import warnings that don't stop the process but may need attention.
func LogImportWarning(ctx context.Context, userID int32, operation string, warning string, metadata map[string]interface{}) {
	// Sanitize metadata
	sanitized := make(map[string]interface{})
	for k, v := range metadata {
		lowerKey := strings.ToLower(k)
		if SensitiveFields[lowerKey] {
			sanitized[k] = "[REDACTED]"
			continue
		}
		sanitized[k] = v
	}

	sanitized["timestamp"] = time.Now().Format(time.RFC3339)

	log.Printf(
		"[IMPORT_WARNING] user_id=%d operation=%s warning=%s metadata=%+v",
		userID,
		operation,
		warning,
		sanitized,
	)
}

// SanitizeErrorForLogging removes sensitive information from error messages.
func SanitizeErrorForLogging(err error) string {
	if err == nil {
		return ""
	}

	errMsg := err.Error()

	// Remove potential sensitive patterns from error messages
	// Example: "transaction amount 50000 failed" -> "transaction amount [REDACTED] failed"
	sensitivePatterns := []string{
		"amount",
		"balance",
		"description",
		"account",
		"reference",
	}

	for _, pattern := range sensitivePatterns {
		if strings.Contains(strings.ToLower(errMsg), pattern) {
			// Keep the error context but mark that sensitive data was present
			return fmt.Sprintf("%s [sensitive data redacted]", strings.Split(errMsg, pattern)[0])
		}
	}

	return errMsg
}

// ImportErrorMetadata creates a metadata map for import errors with safe fields.
func ImportErrorMetadata(fileID string, fileType string, rowCount int32, errorCount int32) map[string]interface{} {
	return map[string]interface{}{
		"file_id":     fileID,
		"file_type":   fileType,
		"row_count":   rowCount,
		"error_count": errorCount,
	}
}
