package repository

import (
	"context"

	"wealthjourney/domain/models"
	"wealthjourney/pkg/database"
)

// merchantRuleRepository implements MerchantRuleRepository using GORM.
type merchantRuleRepository struct {
	*BaseRepository
}

// NewMerchantRuleRepository creates a new MerchantRuleRepository.
func NewMerchantRuleRepository(db *database.Database) MerchantRuleRepository {
	return &merchantRuleRepository{
		BaseRepository: NewBaseRepository(db),
	}
}

// Create creates a new merchant category rule.
func (r *merchantRuleRepository) Create(ctx context.Context, rule *models.MerchantCategoryRule) error {
	result := r.db.DB.WithContext(ctx).Create(rule)
	if result.Error != nil {
		return r.handleDBError(result.Error, "merchant_category_rule", "create merchant rule")
	}
	return nil
}

// GetByID retrieves a merchant category rule by ID.
func (r *merchantRuleRepository) GetByID(ctx context.Context, id int32) (*models.MerchantCategoryRule, error) {
	var rule models.MerchantCategoryRule
	err := r.executeGetByID(ctx, &rule, id, "merchant_category_rule")
	if err != nil {
		return nil, err
	}
	return &rule, nil
}

// ListActive retrieves all active merchant category rules for a region.
func (r *merchantRuleRepository) ListActive(ctx context.Context, region string) ([]*models.MerchantCategoryRule, error) {
	var rules []*models.MerchantCategoryRule
	query := r.db.DB.WithContext(ctx).
		Where("is_active = ? AND (region = ? OR region = 'ALL')", true, region).
		Order("confidence DESC, usage_count DESC")

	result := query.Find(&rules)
	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "merchant_category_rule", "list active rules")
	}

	return rules, nil
}

// IncrementUsageCount increments the usage count for a rule.
func (r *merchantRuleRepository) IncrementUsageCount(ctx context.Context, id int32) error {
	result := r.db.DB.WithContext(ctx).
		Model(&models.MerchantCategoryRule{}).
		Where("id = ?", id).
		UpdateColumn("usage_count", r.db.DB.Raw("usage_count + 1"))

	if result.Error != nil {
		return r.handleDBError(result.Error, "merchant_category_rule", "increment usage count")
	}
	return nil
}

// Update updates a merchant category rule.
func (r *merchantRuleRepository) Update(ctx context.Context, rule *models.MerchantCategoryRule) error {
	return r.executeUpdate(ctx, rule, "merchant_category_rule")
}

// Delete soft deletes a merchant category rule.
func (r *merchantRuleRepository) Delete(ctx context.Context, id int32) error {
	return r.executeDelete(ctx, &models.MerchantCategoryRule{}, id, "merchant_category_rule")
}
