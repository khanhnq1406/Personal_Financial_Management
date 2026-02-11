package parser

import (
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
)

// AmountFormat defines how amounts are formatted
type AmountFormat struct {
	DecimalSeparator    string // "." or ","
	ThousandsSeparator  string // "," or "." or " "
	CurrencySymbol      string // "₫", "$", "EUR", etc.
	NegativePattern     string // "prefix", "suffix", "parentheses"
}

// AmountParser handles parsing monetary amounts with various formats
type AmountParser struct {
	format *AmountFormat
}

// NewAmountParser creates a new amount parser with the specified format
func NewAmountParser(format *AmountFormat) *AmountParser {
	// Use defaults if format is nil
	if format == nil {
		format = &AmountFormat{
			DecimalSeparator:   ".",
			ThousandsSeparator: ",",
			CurrencySymbol:     "",
			NegativePattern:    "prefix",
		}
	}
	return &AmountParser{format: format}
}

// NewAmountParserWithAutoDetect creates a parser that auto-detects the format
func NewAmountParserWithAutoDetect() *AmountParser {
	return &AmountParser{format: nil}
}

// Parse parses an amount string and returns the value in smallest currency unit (×10000)
func (p *AmountParser) Parse(amountStr string) (int64, error) {
	amountStr = strings.TrimSpace(amountStr)
	if amountStr == "" {
		return 0, fmt.Errorf("empty amount")
	}

	// Track if amount is negative
	isNegative := false

	// Handle negative patterns
	amountStr, isNegative = p.detectNegative(amountStr)

	// Remove currency symbols
	amountStr = p.removeCurrencySymbols(amountStr)
	amountStr = strings.TrimSpace(amountStr)

	// Auto-detect format if not specified
	format := p.format
	if format == nil {
		format = p.autoDetectFormat(amountStr)
	}

	// Parse the amount using the detected/specified format
	floatAmount, err := p.parseWithFormat(amountStr, format)
	if err != nil {
		return 0, err
	}

	// Apply negative sign
	if isNegative {
		floatAmount = -floatAmount
	}

	// Convert to smallest currency unit (×10000 for 4 decimal precision)
	// Use proper rounding to avoid floating point precision issues
	amount := int64(math.Round(floatAmount * 10000))

	return amount, nil
}

// detectNegative detects and removes negative indicators
func (p *AmountParser) detectNegative(amountStr string) (string, bool) {
	isNegative := false

	// Check for parentheses notation: (100) → -100
	if strings.HasPrefix(amountStr, "(") && strings.HasSuffix(amountStr, ")") {
		isNegative = true
		amountStr = strings.TrimPrefix(amountStr, "(")
		amountStr = strings.TrimSuffix(amountStr, ")")
		amountStr = strings.TrimSpace(amountStr)
		return amountStr, isNegative
	}

	// Check for trailing minus: 100- → -100
	if strings.HasSuffix(amountStr, "-") {
		isNegative = true
		amountStr = strings.TrimSuffix(amountStr, "-")
		amountStr = strings.TrimSpace(amountStr)
		return amountStr, isNegative
	}

	// Check for leading minus: -100 → -100
	if strings.HasPrefix(amountStr, "-") {
		isNegative = true
		amountStr = strings.TrimPrefix(amountStr, "-")
		amountStr = strings.TrimSpace(amountStr)
		return amountStr, isNegative
	}

	// Check for + prefix (positive, but remove it)
	if strings.HasPrefix(amountStr, "+") {
		amountStr = strings.TrimPrefix(amountStr, "+")
		amountStr = strings.TrimSpace(amountStr)
	}

	return amountStr, isNegative
}

// removeCurrencySymbols removes common currency symbols
func (p *AmountParser) removeCurrencySymbols(amountStr string) string {
	// Common currency symbols and codes
	currencySymbols := []string{
		"₫", "đ", "VND", "VNĐ",
		"$", "USD",
		"€", "EUR",
		"£", "GBP",
		"¥", "JPY", "CNY",
		"₹", "INR",
		"฿", "THB",
		"₩", "KRW",
		"₽", "RUB",
		"R$", "BRL",
		"CHF", "CAD", "AUD", "NZD", "SGD", "HKD",
	}

	for _, symbol := range currencySymbols {
		amountStr = strings.ReplaceAll(amountStr, symbol, "")
	}

	return amountStr
}

// autoDetectFormat detects the number format based on the amount string
func (p *AmountParser) autoDetectFormat(amountStr string) *AmountFormat {
	format := &AmountFormat{
		DecimalSeparator:   ".",
		ThousandsSeparator: ",",
	}

	// Count occurrences of dot and comma
	dotCount := strings.Count(amountStr, ".")
	commaCount := strings.Count(amountStr, ",")
	spaceCount := strings.Count(amountStr, " ")

	// Find last occurrence of dot and comma
	lastDot := strings.LastIndex(amountStr, ".")
	lastComma := strings.LastIndex(amountStr, ",")

	// Decision logic:
	// 1. If only dots or only commas exist, determine by position and count
	// 2. If both exist, the one that appears last is likely the decimal separator
	// 3. If there are spaces, they're likely thousands separators

	if dotCount == 0 && commaCount == 0 {
		// No separators - integer or no formatting
		return format
	}

	if dotCount > 0 && commaCount == 0 {
		// Only dots
		if dotCount == 1 {
			// Could be decimal or thousands
			// If dot position suggests thousands (e.g., 1.000), treat as thousands
			if len(amountStr)-lastDot-1 == 3 {
				// Likely European format: 1.000
				format.DecimalSeparator = ","
				format.ThousandsSeparator = "."
			}
		} else {
			// Multiple dots - must be thousands separator (European)
			format.DecimalSeparator = ","
			format.ThousandsSeparator = "."
		}
	} else if commaCount > 0 && dotCount == 0 {
		// Only commas
		if commaCount == 1 {
			// Could be decimal or thousands
			// If comma position suggests thousands (e.g., 1,000), treat as thousands
			if len(amountStr)-lastComma-1 == 3 {
				// Likely US format: 1,000
				format.DecimalSeparator = "."
				format.ThousandsSeparator = ","
			} else {
				// Likely European decimal: 1,50
				format.DecimalSeparator = ","
				format.ThousandsSeparator = "."
			}
		} else {
			// Multiple commas - must be thousands separator (US)
			format.DecimalSeparator = "."
			format.ThousandsSeparator = ","
		}
	} else {
		// Both dots and commas exist - last one is decimal separator
		if lastDot > lastComma {
			// US format: 1,234.56
			format.DecimalSeparator = "."
			format.ThousandsSeparator = ","
		} else {
			// European format: 1.234,56
			format.DecimalSeparator = ","
			format.ThousandsSeparator = "."
		}
	}

	// Handle spaces as thousands separators
	if spaceCount > 0 {
		format.ThousandsSeparator = " "
	}

	return format
}

// parseWithFormat parses the amount string using the specified format
func (p *AmountParser) parseWithFormat(amountStr string, format *AmountFormat) (float64, error) {
	// Remove thousands separators
	if format.ThousandsSeparator != "" {
		amountStr = strings.ReplaceAll(amountStr, format.ThousandsSeparator, "")
	}

	// Replace decimal separator with standard dot
	if format.DecimalSeparator != "." {
		amountStr = strings.ReplaceAll(amountStr, format.DecimalSeparator, ".")
	}

	// Remove any remaining spaces
	amountStr = strings.ReplaceAll(amountStr, " ", "")

	// Final validation - should only contain digits, dots, and possibly minus
	if !regexp.MustCompile(`^-?\d+\.?\d*$`).MatchString(amountStr) {
		return 0, fmt.Errorf("invalid number format after parsing: %s", amountStr)
	}

	// Parse as float
	floatAmount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		return 0, fmt.Errorf("failed to parse number: %w", err)
	}

	return floatAmount, nil
}

// ParseWithFormat is a convenience function to parse with explicit format
func ParseWithFormat(amountStr string, decimalSep string, thousandsSep string) (int64, error) {
	format := &AmountFormat{
		DecimalSeparator:   decimalSep,
		ThousandsSeparator: thousandsSep,
	}
	parser := NewAmountParser(format)
	return parser.Parse(amountStr)
}

// ParseWithAutoDetect is a convenience function to parse with auto-detection
func ParseWithAutoDetect(amountStr string) (int64, error) {
	parser := NewAmountParserWithAutoDetect()
	return parser.Parse(amountStr)
}
