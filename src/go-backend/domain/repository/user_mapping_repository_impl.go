package repository

import (
	"context"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"wealthjourney/domain/models"
	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/database"
)

// userMappingRepository implements UserMappingRepository using GORM.
type userMappingRepository struct {
	*BaseRepository
}

// NewUserMappingRepository creates a new UserMappingRepository.
func NewUserMappingRepository(db *database.Database) UserMappingRepository {
	return &userMappingRepository{
		BaseRepository: NewBaseRepository(db),
	}
}

// Create creates a new user category mapping.
func (r *userMappingRepository) Create(ctx context.Context, mapping *models.UserCategoryMapping) error {
	result := r.db.DB.WithContext(ctx).Create(mapping)
	if result.Error != nil {
		return r.handleDBError(result.Error, "user_category_mapping", "create mapping")
	}
	return nil
}

// GetByID retrieves a user category mapping by ID.
func (r *userMappingRepository) GetByID(ctx context.Context, id int32) (*models.UserCategoryMapping, error) {
	var mapping models.UserCategoryMapping
	err := r.executeGetByID(ctx, &mapping, id, "user_category_mapping")
	if err != nil {
		return nil, err
	}
	return &mapping, nil
}

// GetByUserIDAndPattern retrieves a mapping by user ID and description pattern.
func (r *userMappingRepository) GetByUserIDAndPattern(ctx context.Context, userID int32, pattern string) (*models.UserCategoryMapping, error) {
	var mapping models.UserCategoryMapping
	result := r.db.DB.WithContext(ctx).
		Where("user_id = ? AND description_pattern = ?", userID, pattern).
		First(&mapping)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, apperrors.NewNotFoundError("user_category_mapping")
		}
		return nil, r.handleDBError(result.Error, "user_category_mapping", "get by user and pattern")
	}

	return &mapping, nil
}

// ListByUserID retrieves all category mappings for a user.
func (r *userMappingRepository) ListByUserID(ctx context.Context, userID int32) ([]*models.UserCategoryMapping, error) {
	var mappings []*models.UserCategoryMapping
	query := r.db.DB.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("usage_count DESC, last_used_at DESC")

	result := query.Find(&mappings)
	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "user_category_mapping", "list by user")
	}

	return mappings, nil
}

// CreateOrUpdate creates a new mapping or updates existing one (upsert).
func (r *userMappingRepository) CreateOrUpdate(ctx context.Context, mapping *models.UserCategoryMapping) error {
	// Use GORM's Clauses with OnConflict for upsert
	result := r.db.DB.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{
			{Name: "user_id"},
			{Name: "description_pattern"},
		},
		DoUpdates: clause.AssignmentColumns([]string{
			"category_id",
			"confidence",
			"usage_count",
			"last_used_at",
			"updated_at",
		}),
	}).Create(mapping)

	if result.Error != nil {
		return r.handleDBError(result.Error, "user_category_mapping", "create or update mapping")
	}

	return nil
}

// UpdateLastUsed updates the last used timestamp and increments usage count.
func (r *userMappingRepository) UpdateLastUsed(ctx context.Context, id int32) error {
	result := r.db.DB.WithContext(ctx).
		Model(&models.UserCategoryMapping{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"last_used_at": time.Now(),
			"usage_count":  r.db.DB.Raw("usage_count + 1"),
			"updated_at":   time.Now(),
		})

	if result.Error != nil {
		return r.handleDBError(result.Error, "user_category_mapping", "update last used")
	}
	return nil
}

// Update updates a user category mapping.
func (r *userMappingRepository) Update(ctx context.Context, mapping *models.UserCategoryMapping) error {
	return r.executeUpdate(ctx, mapping, "user_category_mapping")
}

// Delete soft deletes a user category mapping.
func (r *userMappingRepository) Delete(ctx context.Context, id int32) error {
	return r.executeDelete(ctx, &models.UserCategoryMapping{}, id, "user_category_mapping")
}
