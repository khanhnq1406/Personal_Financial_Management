// Package duplicate provides duplicate transaction detection functionality
package duplicate

import (
	"context"
	"fmt"
	"math"
	"regexp"
	"strings"
	"time"

	"wealthjourney/domain/models"
	v1 "wealthjourney/protobuf/v1"
)

// Package-level compiled regex patterns for performance
var (
	refPatternParens = regexp.MustCompile(`\(Ref:\s*([^\)]+)\)`)
	refPatternPipe   = regexp.MustCompile(`\|\s*Ref:\s*(.+)$`)
)

// DuplicateMatch represents a potential duplicate transaction match
type DuplicateMatch struct {
	ImportedTransaction *v1.ParsedTransaction
	ExistingTransaction *models.Transaction
	Confidence          int32
	MatchReason         string
}

// Detector provides duplicate detection functionality
type Detector struct {
	repo TransactionRepository
}

// TransactionRepository interface for accessing transaction data
type TransactionRepository interface {
	FindByWalletAndDateRange(ctx context.Context, walletID int32, startDate, endDate time.Time) ([]*models.Transaction, error)
}

// NewDetector creates a new Detector instance
func NewDetector(repo TransactionRepository) *Detector {
	return &Detector{repo: repo}
}

// DetectDuplicates detects potential duplicates for a list of parsed transactions
func (d *Detector) DetectDuplicates(ctx context.Context, walletID int32, transactions []*v1.ParsedTransaction) ([]*DuplicateMatch, error) {
	if len(transactions) == 0 {
		return []*DuplicateMatch{}, nil
	}

	// Find the date range for the transactions
	var minDate, maxDate time.Time
	for _, tx := range transactions {
		txDate := time.Unix(tx.Date, 0)
		if minDate.IsZero() || txDate.Before(minDate) {
			minDate = txDate
		}
		if maxDate.IsZero() || txDate.After(maxDate) {
			maxDate = txDate
		}
	}

	// Expand the search window by 7 days in each direction (for Level 4 matching)
	searchStart := minDate.AddDate(0, 0, -7)
	searchEnd := maxDate.AddDate(0, 0, 7)

	// Fetch existing transactions in the date range
	existingTxs, err := d.repo.FindByWalletAndDateRange(ctx, walletID, searchStart, searchEnd)
	if err != nil {
		return nil, err
	}

	// If no existing transactions, no duplicates possible
	if len(existingTxs) == 0 {
		return []*DuplicateMatch{}, nil
	}

	// Detect duplicates for each parsed transaction
	var matches []*DuplicateMatch
	for _, parsedTx := range transactions {
		match := d.findBestMatch(parsedTx, existingTxs)
		if match != nil {
			matches = append(matches, match)
		}
	}

	return matches, nil
}

// findBestMatch finds the best matching existing transaction for a parsed transaction
func (d *Detector) findBestMatch(parsed *v1.ParsedTransaction, existingTxs []*models.Transaction) *DuplicateMatch {
	var bestMatch *DuplicateMatch

	parsedDate := time.Unix(parsed.Date, 0)
	parsedAmount := parsed.Amount.Amount
	parsedDesc := parsed.Description
	parsedRef := parsed.ReferenceNumber

	for _, existing := range existingTxs {
		// Try each matching level in order of confidence
		if match := d.level1Match(parsed, existing, parsedDate, parsedAmount, parsedRef); match != nil {
			if bestMatch == nil || match.Confidence > bestMatch.Confidence {
				bestMatch = match
			}
		} else if match := d.level2Match(parsed, existing, parsedDate, parsedAmount, parsedDesc); match != nil {
			if bestMatch == nil || match.Confidence > bestMatch.Confidence {
				bestMatch = match
			}
		} else if match := d.level3Match(parsed, existing, parsedDate, parsedAmount, parsedDesc); match != nil {
			if bestMatch == nil || match.Confidence > bestMatch.Confidence {
				bestMatch = match
			}
		} else if match := d.level4Match(parsed, existing, parsedDate, parsedAmount, parsedDesc); match != nil {
			if bestMatch == nil || match.Confidence > bestMatch.Confidence {
				bestMatch = match
			}
		}
	}

	return bestMatch
}

// level1Match: Exact match (99%) - same wallet, amount, date, reference
func (d *Detector) level1Match(parsed *v1.ParsedTransaction, existing *models.Transaction, parsedDate time.Time, parsedAmount int64, parsedRef string) *DuplicateMatch {
	// 1. Check amount match (required)
	if existing.Amount != parsedAmount {
		return nil
	}

	// 2. Check date match (required)
	existingDateStr := existing.Date.Format("2006-01-02")
	parsedDateStr := parsedDate.Format("2006-01-02")
	if existingDateStr != parsedDateStr {
		return nil
	}

	// 3. Check reference number match (if available on both)
	if parsedRef != "" {
		existingRef := d.extractReferenceFromNote(existing.Note)

		// Both have reference numbers - must match exactly
		if existingRef != "" {
			if parsedRef == existingRef { // Exact comparison - reference numbers are case-sensitive
				return &DuplicateMatch{
					ImportedTransaction: parsed,
					ExistingTransaction: existing,
					Confidence:          99,
					MatchReason:         "Exact match: same amount, date, and reference number",
				}
			}
			// Reference numbers exist but don't match
			return nil
		}
	}

	// If we reach here: not a Level 1 exact match
	return nil
}

// extractReferenceFromNote extracts reference number from transaction note
func (d *Detector) extractReferenceFromNote(note string) string {
	// Match "(Ref: XXXXX)" pattern
	matches := refPatternParens.FindStringSubmatch(note)
	if len(matches) > 1 {
		return strings.TrimSpace(matches[1])
	}

	// Match "| Ref: XXXXX" pattern
	matches = refPatternPipe.FindStringSubmatch(note)
	if len(matches) > 1 {
		return strings.TrimSpace(matches[1])
	}

	return ""
}

// level2Match: Strong match (90-95%) - same amount, date ±1 day, description similarity >80%
func (d *Detector) level2Match(parsed *v1.ParsedTransaction, existing *models.Transaction, parsedDate time.Time, parsedAmount int64, parsedDesc string) *DuplicateMatch {
	// Check amount match
	if existing.Amount != parsedAmount {
		return nil
	}

	// Check date within ±1 day
	daysDiff := math.Abs(parsedDate.Sub(existing.Date).Hours() / 24)
	if daysDiff > 1.0 {
		return nil
	}

	// Check description similarity (requires >80% similarity)
	similarity := stringSimilarity(existing.Note, parsedDesc)
	if similarity < 80.0 {
		return nil
	}

	// Calculate confidence: 90-95 based on similarity
	confidence := int32(90 + int((similarity-80.0)/20.0*5.0))
	if confidence > 95 {
		confidence = 95
	}
	if confidence < 90 {
		confidence = 90
	}

	return &DuplicateMatch{
		ImportedTransaction: parsed,
		ExistingTransaction: existing,
		Confidence:          confidence,
		MatchReason:         fmt.Sprintf("Strong match: same amount (%.2f), date within 1 day, %.0f%% description match", float64(parsedAmount)/10000, similarity),
	}
}

// level3Match: Likely match (70-85%) - amount ±5%, date ±3 days, description similarity >60%
func (d *Detector) level3Match(parsed *v1.ParsedTransaction, existing *models.Transaction, parsedDate time.Time, parsedAmount int64, parsedDesc string) *DuplicateMatch {
	// Skip if parsedAmount is zero to avoid division by zero
	if parsedAmount == 0 {
		return nil
	}

	// Check amount within ±5%
	amountDiff := math.Abs(float64(existing.Amount-parsedAmount)) / math.Abs(float64(parsedAmount))
	if amountDiff > 0.05 {
		return nil
	}

	// Check date within ±3 days
	daysDiff := math.Abs(parsedDate.Sub(existing.Date).Hours() / 24)
	if daysDiff > 3.0 {
		return nil
	}

	// Check description similarity (requires >60% similarity)
	similarity := stringSimilarity(existing.Note, parsedDesc)
	if similarity < 60.0 {
		return nil
	}

	// Calculate confidence based on similarity and date/amount closeness
	baseConfidence := 70.0
	similarityBonus := (similarity - 60.0) / 40.0 * 10.0  // 0-10 bonus (60-100% -> 0-10)
	dateBonus := (3.0 - daysDiff) / 3.0 * 3.0             // 0-3 bonus
	amountBonus := (0.05 - amountDiff) / 0.05 * 2.0       // 0-2 bonus

	confidence := int32(baseConfidence + similarityBonus + dateBonus + amountBonus)
	if confidence > 85 {
		confidence = 85
	}
	if confidence < 70 {
		confidence = 70
	}

	return &DuplicateMatch{
		ImportedTransaction: parsed,
		ExistingTransaction: existing,
		Confidence:          confidence,
		MatchReason:         fmt.Sprintf("Likely match: amount within 5%%, date within 3 days, %.0f%% description match", similarity),
	}
}

// level4Match: Possible match (50-65%) - amount ±10%, date ±7 days, merchant name match
func (d *Detector) level4Match(parsed *v1.ParsedTransaction, existing *models.Transaction, parsedDate time.Time, parsedAmount int64, parsedDesc string) *DuplicateMatch {
	// Skip if parsedAmount is zero to avoid division by zero
	if parsedAmount == 0 {
		return nil
	}

	// Check amount within ±10%
	amountDiff := math.Abs(float64(existing.Amount-parsedAmount)) / math.Abs(float64(parsedAmount))
	if amountDiff > 0.10 {
		return nil
	}

	// Check date within ±7 days
	daysDiff := math.Abs(parsedDate.Sub(existing.Date).Hours() / 24)
	if daysDiff > 7.0 {
		return nil
	}

	// Extract and compare merchant names
	existingMerchant := extractMerchantName(existing.Note)
	parsedMerchant := extractMerchantName(parsedDesc)

	merchantSimilarity := stringSimilarity(existingMerchant, parsedMerchant)
	if merchantSimilarity < 70.0 {
		return nil
	}

	// Calculate confidence
	baseConfidence := 50.0
	merchantBonus := (merchantSimilarity - 70.0) / 30.0 * 10.0 // 0-10 bonus (70-100% -> 0-10)
	dateBonus := (7.0 - daysDiff) / 7.0 * 3.0                  // 0-3 bonus
	amountBonus := (0.10 - amountDiff) / 0.10 * 2.0            // 0-2 bonus

	confidence := int32(baseConfidence + merchantBonus + dateBonus + amountBonus)
	if confidence > 65 {
		confidence = 65
	}
	if confidence < 50 {
		confidence = 50
	}

	return &DuplicateMatch{
		ImportedTransaction: parsed,
		ExistingTransaction: existing,
		Confidence:          confidence,
		MatchReason:         fmt.Sprintf("Possible match: amount within 10%%, date within 7 days, merchant match (%.0f%%)", merchantSimilarity),
	}
}

// levenshteinDistance calculates the Levenshtein distance between two strings
func levenshteinDistance(s1, s2 string) int {
	return LevenshteinDistance(s1, s2)
}

// stringSimilarity calculates the similarity between two strings (0-100%)
func stringSimilarity(s1, s2 string) float64 {
	// Use existing CalculateStringSimilarity which returns 0-1
	similarity := CalculateStringSimilarity(s1, s2)
	// Convert to percentage (0-100)
	return similarity * 100.0
}

// extractMerchantName extracts the merchant name from a transaction description
func extractMerchantName(description string) string {
	// Normalize the description
	desc := strings.ToUpper(strings.TrimSpace(description))

	// Remove common prefixes
	prefixes := []string{
		"PAYMENT TO ",
		"PURCHASE AT ",
		"PURCHASE FROM ",
		"PAYMENT FOR ",
		"PAYMENT ",
		"PURCHASE ",
	}

	for _, prefix := range prefixes {
		if strings.HasPrefix(desc, prefix) {
			desc = strings.TrimPrefix(desc, prefix)
			break
		}
	}

	// Extract the first significant word(s) as merchant name
	// Remove domain extensions
	desc = regexp.MustCompile(`\.(COM|VN|NET|ORG)$`).ReplaceAllString(desc, "")

	// Take first 1-3 words as merchant name
	words := strings.Fields(desc)
	if len(words) == 0 {
		return desc
	}

	// Take up to 3 words or until we hit a number/location indicator
	merchantWords := []string{}
	for i := 0; i < len(words) && i < 3; i++ {
		word := words[i]
		// Stop if we hit a location or number
		if isLocationWord(word) || isNumeric(word) {
			break
		}
		merchantWords = append(merchantWords, word)
	}

	if len(merchantWords) == 0 {
		return words[0]
	}

	return strings.Join(merchantWords, " ")
}

// isLocationWord checks if a word is a location indicator
func isLocationWord(word string) bool {
	locations := map[string]bool{
		"HA": true, "NOI": true, "HANOI": true,
		"SAIGON": true, "HCM": true, "HCMC": true,
		"DA": true, "NANG": true, "DANANG": true,
		"STORE": true, "BRANCH": true, "LOCATION": true,
	}
	return locations[strings.ToUpper(word)]
}

// isNumeric checks if a string contains only numbers
func isNumeric(s string) bool {
	matched := regexp.MustCompile(`^\d+$`).MatchString(s)
	return matched
}
