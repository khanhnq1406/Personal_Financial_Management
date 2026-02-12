package repository

import (
	"context"

	"wealthjourney/domain/models"
	"wealthjourney/pkg/database"
)

// keywordRepository implements KeywordRepository using GORM.
type keywordRepository struct {
	*BaseRepository
}

// NewKeywordRepository creates a new KeywordRepository.
func NewKeywordRepository(db *database.Database) KeywordRepository {
	return &keywordRepository{
		BaseRepository: NewBaseRepository(db),
	}
}

// Create creates a new category keyword.
func (r *keywordRepository) Create(ctx context.Context, keyword *models.CategoryKeyword) error {
	result := r.db.DB.WithContext(ctx).Create(keyword)
	if result.Error != nil {
		return r.handleDBError(result.Error, "category_keyword", "create keyword")
	}
	return nil
}

// GetByID retrieves a category keyword by ID.
func (r *keywordRepository) GetByID(ctx context.Context, id int32) (*models.CategoryKeyword, error) {
	var keyword models.CategoryKeyword
	err := r.executeGetByID(ctx, &keyword, id, "category_keyword")
	if err != nil {
		return nil, err
	}
	return &keyword, nil
}

// ListActive retrieves all active category keywords.
func (r *keywordRepository) ListActive(ctx context.Context) ([]*models.CategoryKeyword, error) {
	var keywords []*models.CategoryKeyword
	query := r.db.DB.WithContext(ctx).
		Where("is_active = ?", true).
		Order("confidence DESC")

	result := query.Find(&keywords)
	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "category_keyword", "list active keywords")
	}

	return keywords, nil
}

// ListByCategoryID retrieves all keywords for a specific category.
func (r *keywordRepository) ListByCategoryID(ctx context.Context, categoryID int32) ([]*models.CategoryKeyword, error) {
	var keywords []*models.CategoryKeyword
	query := r.db.DB.WithContext(ctx).
		Where("category_id = ? AND is_active = ?", categoryID, true).
		Order("confidence DESC")

	result := query.Find(&keywords)
	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "category_keyword", "list keywords by category")
	}

	return keywords, nil
}

// Update updates a category keyword.
func (r *keywordRepository) Update(ctx context.Context, keyword *models.CategoryKeyword) error {
	return r.executeUpdate(ctx, keyword, "category_keyword")
}

// Delete soft deletes a category keyword.
func (r *keywordRepository) Delete(ctx context.Context, id int32) error {
	return r.executeDelete(ctx, &models.CategoryKeyword{}, id, "category_keyword")
}

// BulkCreate creates multiple keywords in a single transaction.
func (r *keywordRepository) BulkCreate(ctx context.Context, keywords []*models.CategoryKeyword) error {
	if len(keywords) == 0 {
		return nil
	}

	result := r.db.DB.WithContext(ctx).CreateInBatches(keywords, 100)
	if result.Error != nil {
		return r.handleDBError(result.Error, "category_keyword", "bulk create keywords")
	}

	return nil
}
