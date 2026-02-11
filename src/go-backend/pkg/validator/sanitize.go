package validator

import (
	"html"
	"strings"
	"unicode"
	"unicode/utf8"

	apperrors "wealthjourney/pkg/errors"
)

// SanitizeDescription sanitizes a transaction description for safe storage.
// - Removes null bytes and control characters
// - HTML entity decodes to prevent double-encoding
// - Validates UTF-8
// - Limits length to 500 characters
func SanitizeDescription(desc string) (string, error) {
	if desc == "" {
		return "", nil // Empty is valid
	}

	// Validate UTF-8 encoding
	if !utf8.ValidString(desc) {
		return "", apperrors.NewValidationError("description contains invalid UTF-8 characters")
	}

	// HTML decode to prevent double-encoding
	desc = html.UnescapeString(desc)

	// Remove null bytes
	desc = strings.ReplaceAll(desc, "\x00", "")

	// Remove control characters except newline, tab, and carriage return
	var sanitized strings.Builder
	for _, r := range desc {
		if unicode.IsControl(r) {
			// Keep only these control characters
			if r == '\n' || r == '\t' || r == '\r' {
				sanitized.WriteRune(r)
			}
			// Skip all other control characters
			continue
		}
		sanitized.WriteRune(r)
	}

	result := sanitized.String()

	// Trim whitespace
	result = strings.TrimSpace(result)

	// Limit length to 500 characters
	const maxLength = 500
	if len([]rune(result)) > maxLength {
		runes := []rune(result)
		result = string(runes[:maxLength])
	}

	return result, nil
}

// SanitizeNote sanitizes a transaction note (alias for SanitizeDescription).
func SanitizeNote(note string) (string, error) {
	return SanitizeDescription(note)
}

// SanitizeStringField sanitizes a generic string field with configurable max length.
func SanitizeStringField(field string, maxLength int) (string, error) {
	if field == "" {
		return "", nil
	}

	// Validate UTF-8
	if !utf8.ValidString(field) {
		return "", apperrors.NewValidationError("field contains invalid UTF-8 characters")
	}

	// Remove null bytes
	field = strings.ReplaceAll(field, "\x00", "")

	// Remove control characters
	var sanitized strings.Builder
	for _, r := range field {
		if unicode.IsControl(r) {
			if r == '\n' || r == '\t' || r == '\r' {
				sanitized.WriteRune(r)
			}
			continue
		}
		sanitized.WriteRune(r)
	}

	result := sanitized.String()
	result = strings.TrimSpace(result)

	// Apply length limit
	if maxLength > 0 && len([]rune(result)) > maxLength {
		runes := []rune(result)
		result = string(runes[:maxLength])
	}

	return result, nil
}
