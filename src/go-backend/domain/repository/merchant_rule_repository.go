package repository

import (
	"context"
	"wealthjourney/domain/models"
)

// MerchantRuleRepository defines the interface for merchant category rule operations.
type MerchantRuleRepository interface {
	// Create creates a new merchant category rule.
	Create(ctx context.Context, rule *models.MerchantCategoryRule) error

	// GetByID retrieves a merchant category rule by ID.
	GetByID(ctx context.Context, id int32) (*models.MerchantCategoryRule, error)

	// ListActive retrieves all active merchant category rules for a region.
	ListActive(ctx context.Context, region string) ([]*models.MerchantCategoryRule, error)

	// IncrementUsageCount increments the usage count for a rule.
	IncrementUsageCount(ctx context.Context, id int32) error

	// Update updates a merchant category rule.
	Update(ctx context.Context, rule *models.MerchantCategoryRule) error

	// Delete soft deletes a merchant category rule.
	Delete(ctx context.Context, id int32) error
}
