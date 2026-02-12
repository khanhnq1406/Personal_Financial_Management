package parser

import (
	"regexp"
	"strings"
	"unicode"
)

// DescriptionCleaner cleans and normalizes transaction descriptions
type DescriptionCleaner struct {
	// Configurable options
	removeTransactionCodes bool
	extractMerchantName    bool
	normalizeWhitespace    bool
	properCapitalization   bool
}

// NewDescriptionCleaner creates a new description cleaner with default settings
func NewDescriptionCleaner() *DescriptionCleaner {
	return &DescriptionCleaner{
		removeTransactionCodes: true,
		extractMerchantName:    true,
		normalizeWhitespace:    true,
		properCapitalization:   true,
	}
}

// Clean cleans and normalizes a transaction description
func (c *DescriptionCleaner) Clean(description string) string {
	if description == "" {
		return "Imported Transaction"
	}

	// Step 1: Remove bank prefixes
	description = c.removeBankPrefixes(description)

	// Step 2: Remove transaction codes
	if c.removeTransactionCodes {
		description = c.removeTransactionCodesFromDesc(description)
	}

	// Step 3: Strip long numbers (likely account numbers, card numbers, etc.)
	description = c.stripLongNumbers(description)

	// Step 4: Extract merchant name if possible
	if c.extractMerchantName {
		description = c.extractMerchant(description)
	}

	// Step 5: Normalize whitespace
	if c.normalizeWhitespace {
		description = c.normalizeWhitespaceInDesc(description)
	}

	// Step 6: Proper capitalization
	if c.properCapitalization {
		description = c.applyProperCapitalization(description)
	}

	// Final cleanup
	description = strings.TrimSpace(description)

	if description == "" {
		return "Imported Transaction"
	}

	return description
}

// removeBankPrefixes removes common bank statement prefixes
func (c *DescriptionCleaner) removeBankPrefixes(description string) string {
	// Common English prefixes
	prefixes := []string{
		"PURCHASE AT ",
		"PURCHASE FROM ",
		"PAYMENT TO ",
		"PAYMENT FROM ",
		"TRANSFER TO ",
		"TRANSFER FROM ",
		"WITHDRAWAL AT ",
		"WITHDRAWAL FROM ",
		"DEPOSIT AT ",
		"DEPOSIT FROM ",
		"POS PURCHASE ",
		"POS WITHDRAWAL ",
		"POS ",
		"ATM WITHDRAWAL ",
		"ATM DEPOSIT ",
		"ATM ",
		"DEBIT CARD PURCHASE ",
		"CREDIT CARD PAYMENT ",
		"ONLINE PAYMENT ",
		"ONLINE PURCHASE ",
		"RECURRING PAYMENT ",
		"AUTOPAY ",
		"DIRECT DEBIT ",
		"STANDING ORDER ",
		"BANK TRANSFER ",
		"WIRE TRANSFER ",
		"ACH PAYMENT ",
		"ACH CREDIT ",
		"ACH DEBIT ",
		"CHECK ",
		"CHEQUE ",
	}

	// Vietnamese prefixes
	vnPrefixes := []string{
		"MUA HÀNG TẠI ",
		"MUA HANG TAI ",
		"THANH TOÁN TẠI ",
		"THANH TOAN TAI ",
		"CHUYỂN KHOẢN ĐẾN ",
		"CHUYEN KHOAN DEN ",
		"RÚT TIỀN TẠI ",
		"RUT TIEN TAI ",
		"NẠP TIỀN TẠI ",
		"NAP TIEN TAI ",
		"GIAO DỊCH TẠI ",
		"GIAO DICH TAI ",
	}

	allPrefixes := append(prefixes, vnPrefixes...)

	for _, prefix := range allPrefixes {
		if strings.HasPrefix(strings.ToUpper(description), prefix) {
			description = description[len(prefix):]
			break
		}
	}

	return strings.TrimSpace(description)
}

// removeTransactionCodesFromDesc removes transaction reference codes
func (c *DescriptionCleaner) removeTransactionCodesFromDesc(description string) string {
	// Patterns to remove
	patterns := []string{
		`REF:\s*\S+`,         // REF:123456
		`TRACE#:\s*\S+`,      // TRACE#:123456
		`AUTH:\s*\S+`,        // AUTH:123456
		`TXN:\s*\S+`,         // TXN:123456
		`TRANS:\s*\S+`,       // TRANS:123456
		`APPROVAL:\s*\S+`,    // APPROVAL:123456
		`REFERENCE:\s*\S+`,   // REFERENCE:123456
		`CONF:\s*\S+`,        // CONF:123456
		`CONFIRMATION:\s*\S+`, // CONFIRMATION:123456
		`ID:\s*\S+`,          // ID:123456
		`\bREF\s+\S+`,        // REF 123456
		`\bTRACE\s+\S+`,      // TRACE 123456
		`\bAUTH\s+\S+`,       // AUTH 123456
		`\bTXN\s+\S+`,        // TXN 123456
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(`(?i)` + pattern)
		description = re.ReplaceAllString(description, "")
	}

	return strings.TrimSpace(description)
}

// stripLongNumbers removes long numeric sequences (>10 digits)
func (c *DescriptionCleaner) stripLongNumbers(description string) string {
	// Remove sequences of 10+ digits (likely account/card numbers)
	re := regexp.MustCompile(`\b\d{10,}\b`)
	description = re.ReplaceAllString(description, "")

	// Remove masked card numbers like **** **** **** 1234
	re = regexp.MustCompile(`\*+\s*\*+\s*\*+\s*\d{4}`)
	description = re.ReplaceAllString(description, "")

	return strings.TrimSpace(description)
}

// extractMerchant attempts to extract merchant name from description
func (c *DescriptionCleaner) extractMerchant(description string) string {
	// Pattern 1: Merchant name before location/city
	// Example: "STARBUCKS HANOI VN" -> "STARBUCKS"
	patterns := []struct {
		regex       *regexp.Regexp
		groupIndex  int
	}{
		{regexp.MustCompile(`^([A-Z0-9\s&'-]+?)\s+(?:HANOI|HO CHI MINH|SAIGON|DA NANG|HAI PHONG|CAN THO|BIEN HOA|VUNG TAU|NHA TRANG|HUE|DA LAT|VN|VIETNAM)`), 1},
		{regexp.MustCompile(`^([A-Z0-9\s&'-]+?)\s+\d{5,}`), 1}, // Name before zip code
		{regexp.MustCompile(`^([A-Z0-9\s&'-]{3,30})`), 1},      // First 3-30 chars if all caps
	}

	for _, pattern := range patterns {
		matches := pattern.regex.FindStringSubmatch(description)
		if len(matches) > pattern.groupIndex {
			merchantName := strings.TrimSpace(matches[pattern.groupIndex])
			if len(merchantName) >= 3 {
				return merchantName
			}
		}
	}

	return description
}

// normalizeWhitespaceInDesc normalizes whitespace in the description
func (c *DescriptionCleaner) normalizeWhitespaceInDesc(description string) string {
	// Replace multiple spaces with single space
	re := regexp.MustCompile(`\s+`)
	description = re.ReplaceAllString(description, " ")

	// Remove leading/trailing whitespace
	description = strings.TrimSpace(description)

	return description
}

// applyProperCapitalization applies proper capitalization to description
func (c *DescriptionCleaner) applyProperCapitalization(description string) string {
	// If the description is all uppercase or all lowercase, apply title case
	if c.isAllUppercase(description) || c.isAllLowercase(description) {
		return c.toTitleCase(description)
	}

	// If mixed case, leave as is (likely already properly formatted)
	return description
}

// isAllUppercase checks if string is all uppercase (ignoring non-letters)
func (c *DescriptionCleaner) isAllUppercase(s string) bool {
	hasLetter := false
	for _, r := range s {
		if unicode.IsLetter(r) {
			hasLetter = true
			if !unicode.IsUpper(r) {
				return false
			}
		}
	}
	return hasLetter
}

// isAllLowercase checks if string is all lowercase (ignoring non-letters)
func (c *DescriptionCleaner) isAllLowercase(s string) bool {
	hasLetter := false
	for _, r := range s {
		if unicode.IsLetter(r) {
			hasLetter = true
			if !unicode.IsLower(r) {
				return false
			}
		}
	}
	return hasLetter
}

// toTitleCase converts string to title case
func (c *DescriptionCleaner) toTitleCase(s string) string {
	// List of words that should remain lowercase (unless first word)
	lowercaseWords := map[string]bool{
		"a":   true,
		"an":  true,
		"and": true,
		"at":  true,
		"but": true,
		"by":  true,
		"for": true,
		"in":  true,
		"of":  true,
		"on":  true,
		"or":  true,
		"the": true,
		"to":  true,
		"via": true,
		"with": true,
	}

	words := strings.Fields(s)
	for i, word := range words {
		wordLower := strings.ToLower(word)

		// First word or not in lowercase list - capitalize
		if i == 0 || !lowercaseWords[wordLower] {
			// Capitalize first letter, lowercase the rest
			words[i] = c.capitalizeFirst(wordLower)
		} else {
			// Keep as lowercase
			words[i] = wordLower
		}
	}

	return strings.Join(words, " ")
}

// capitalizeFirst capitalizes the first letter of a string
func (c *DescriptionCleaner) capitalizeFirst(s string) string {
	if s == "" {
		return s
	}

	runes := []rune(s)
	runes[0] = unicode.ToUpper(runes[0])
	return string(runes)
}

// CleanDescription is a convenience function to clean a description with default settings
func CleanDescription(description string) string {
	cleaner := NewDescriptionCleaner()
	return cleaner.Clean(description)
}
