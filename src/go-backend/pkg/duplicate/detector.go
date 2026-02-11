// Package duplicate provides duplicate transaction detection functionality
package duplicate

import (
	"context"
	"time"

	"wealthjourney/domain/models"
)

type ConfidenceLevel int

const (
	ConfidenceLow       ConfidenceLevel = 40  // 30-50%
	ConfidenceMedium    ConfidenceLevel = 60  // 50-70%
	ConfidenceMediumHigh ConfidenceLevel = 80 // 70-90%
	ConfidenceHigh      ConfidenceLevel = 95  // 90-100%
)

type DuplicateMatch struct {
	ExistingTransaction *models.Transaction
	Confidence          int
	MatchReason         string
	MatchLevel          int // 1-4
}

type Detector struct {
	repo TransactionRepository
}

type TransactionRepository interface {
	FindByWalletAndDateRange(ctx context.Context, walletID int32, startDate, endDate time.Time) ([]*models.Transaction, error)
	FindByExternalID(ctx context.Context, walletID int32, externalID string) (*models.Transaction, error)
}

func NewDetector(repo TransactionRepository) *Detector {
	return &Detector{repo: repo}
}

// DetectDuplicate checks if a transaction is a duplicate
func (d *Detector) DetectDuplicate(ctx context.Context, walletID int32, date time.Time, amount int64, description string, externalID string) (*DuplicateMatch, error) {
	// Level 1: Exact match on external_id (highest confidence)
	if externalID != "" {
		existing, err := d.repo.FindByExternalID(ctx, walletID, externalID)
		if err == nil && existing != nil {
			return &DuplicateMatch{
				ExistingTransaction: existing,
				Confidence:          int(ConfidenceHigh),
				MatchReason:         "Exact match on external reference ID",
				MatchLevel:          1,
			}, nil
		}
	}

	// Search in ±3 day range for other levels
	startDate := date.AddDate(0, 0, -3)
	endDate := date.AddDate(0, 0, 3)

	candidates, err := d.repo.FindByWalletAndDateRange(ctx, walletID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	var bestMatch *DuplicateMatch

	for _, candidate := range candidates {
		// Level 2: Date + Amount + Note (fuzzy)
		if candidate.Date.Format("2006-01-02") == date.Format("2006-01-02") && candidate.Amount == amount {
			similarity := CalculateStringSimilarity(candidate.Note, description)
			if similarity > 0.8 {
				match := &DuplicateMatch{
					ExistingTransaction: candidate,
					Confidence:          int(ConfidenceMediumHigh),
					MatchReason:         "Same date, amount, and similar description",
					MatchLevel:          2,
				}
				if bestMatch == nil || match.Confidence > bestMatch.Confidence {
					bestMatch = match
				}
			}
		}

		// Level 3: Amount + Date (within ±1 day)
		daysDiff := abs(int(date.Sub(candidate.Date).Hours() / 24))
		if daysDiff <= 1 && candidate.Amount == amount {
			match := &DuplicateMatch{
				ExistingTransaction: candidate,
				Confidence:          int(ConfidenceMedium),
				MatchReason:         "Same amount within 1 day",
				MatchLevel:          3,
			}
			if bestMatch == nil || match.Confidence > bestMatch.Confidence {
				bestMatch = match
			}
		}

		// Level 4: Similar description (Levenshtein distance)
		if bestMatch == nil {
			distance := LevenshteinDistance(candidate.Note, description)
			if distance < 3 && distance > 0 {
				bestMatch = &DuplicateMatch{
					ExistingTransaction: candidate,
					Confidence:          int(ConfidenceLow),
					MatchReason:         "Similar description",
					MatchLevel:          4,
				}
			}
		}
	}

	return bestMatch, nil
}

func abs(n int) int {
	if n < 0 {
		return -n
	}
	return n
}
