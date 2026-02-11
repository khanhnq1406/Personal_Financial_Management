package repository

import (
	"context"

	"wealthjourney/domain/models"
	"wealthjourney/pkg/database"
)

type ImportRepository interface {
	// Import Batch CRUD
	CreateImportBatch(ctx context.Context, batch *models.ImportBatch) error
	GetImportBatchByID(ctx context.Context, id string) (*models.ImportBatch, error)
	ListImportBatchesByUserID(ctx context.Context, userID int32, opts ListOptions) ([]*models.ImportBatch, int, error)
	UpdateImportBatch(ctx context.Context, batch *models.ImportBatch) error

	// Bank Template CRUD
	GetBankTemplateByID(ctx context.Context, id string) (*models.BankTemplate, error)
	ListBankTemplates(ctx context.Context) ([]*models.BankTemplate, error)
	CreateBankTemplate(ctx context.Context, template *models.BankTemplate) error

	// User Template CRUD
	GetUserTemplateByID(ctx context.Context, id int32, userID int32) (*models.UserTemplate, error)
	ListUserTemplatesByUserID(ctx context.Context, userID int32) ([]*models.UserTemplate, error)
	CreateUserTemplate(ctx context.Context, template *models.UserTemplate) error
	UpdateUserTemplate(ctx context.Context, template *models.UserTemplate) error
	DeleteUserTemplate(ctx context.Context, id int32, userID int32) error

	// Transaction linking
	LinkTransactionsToImport(ctx context.Context, importBatchID string, transactionIDs []int32) error
	GetTransactionsByImportBatchID(ctx context.Context, importBatchID string) ([]*models.Transaction, error)
}

type importRepository struct {
	*BaseRepository
}

func NewImportRepository(db *database.Database) ImportRepository {
	return &importRepository{
		BaseRepository: NewBaseRepository(db),
	}
}

func (r *importRepository) CreateImportBatch(ctx context.Context, batch *models.ImportBatch) error {
	result := r.db.DB.WithContext(ctx).Create(batch)
	return r.handleDBError(result.Error, "import batch", "create import batch")
}

func (r *importRepository) GetImportBatchByID(ctx context.Context, id string) (*models.ImportBatch, error) {
	var batch models.ImportBatch
	result := r.db.DB.WithContext(ctx).Where("id = ?", id).First(&batch)
	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "import batch", "get import batch")
	}
	return &batch, nil
}

func (r *importRepository) ListImportBatchesByUserID(ctx context.Context, userID int32, opts ListOptions) ([]*models.ImportBatch, int, error) {
	var batches []*models.ImportBatch
	var total int64

	// Get total count for this user
	if err := r.db.DB.WithContext(ctx).Model(&models.ImportBatch{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, r.handleDBError(err, "import batch", "count import batches")
	}

	// Build query with user filter and pagination
	orderClause := r.buildOrderClause(opts)
	// Default to imported_at DESC if no order specified
	if opts.OrderBy == "" {
		orderClause = "imported_at desc"
	}

	query := r.db.DB.WithContext(ctx).Model(&models.ImportBatch{}).Where("user_id = ?", userID).Order(orderClause)
	query = r.applyPagination(query, opts)

	result := query.Find(&batches)
	if result.Error != nil {
		return nil, 0, r.handleDBError(result.Error, "import batch", "list import batches")
	}

	return batches, int(total), nil
}

func (r *importRepository) UpdateImportBatch(ctx context.Context, batch *models.ImportBatch) error {
	result := r.db.DB.WithContext(ctx).Save(batch)
	return r.handleDBError(result.Error, "import batch", "update import batch")
}

func (r *importRepository) GetBankTemplateByID(ctx context.Context, id string) (*models.BankTemplate, error) {
	var template models.BankTemplate
	result := r.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&template)
	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "bank template", "get bank template")
	}
	return &template, nil
}

func (r *importRepository) ListBankTemplates(ctx context.Context) ([]*models.BankTemplate, error) {
	var templates []*models.BankTemplate
	result := r.db.DB.WithContext(ctx).Where("is_active = ?", true).Find(&templates)
	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "bank template", "list bank templates")
	}
	return templates, nil
}

func (r *importRepository) CreateBankTemplate(ctx context.Context, template *models.BankTemplate) error {
	result := r.db.DB.WithContext(ctx).Create(template)
	return r.handleDBError(result.Error, "bank template", "create bank template")
}

func (r *importRepository) LinkTransactionsToImport(ctx context.Context, importBatchID string, transactionIDs []int32) error {
	// Update transactions to link them to import batch
	result := r.db.DB.WithContext(ctx).
		Model(&models.Transaction{}).
		Where("id IN ?", transactionIDs).
		Update("import_batch_id", importBatchID)
	return r.handleDBError(result.Error, "transaction", "link transactions to import")
}

func (r *importRepository) GetTransactionsByImportBatchID(ctx context.Context, importBatchID string) ([]*models.Transaction, error) {
	var transactions []*models.Transaction
	result := r.db.DB.WithContext(ctx).
		Where("import_batch_id = ?", importBatchID).
		Find(&transactions)
	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "transaction", "get transactions by import batch")
	}
	return transactions, nil
}

func (r *importRepository) GetUserTemplateByID(ctx context.Context, id int32, userID int32) (*models.UserTemplate, error) {
	var template models.UserTemplate
	result := r.db.DB.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).First(&template)
	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "user template", "get user template")
	}
	return &template, nil
}

func (r *importRepository) ListUserTemplatesByUserID(ctx context.Context, userID int32) ([]*models.UserTemplate, error) {
	var templates []*models.UserTemplate
	result := r.db.DB.WithContext(ctx).Where("user_id = ?", userID).Order("created_at desc").Find(&templates)
	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "user template", "list user templates")
	}
	return templates, nil
}

func (r *importRepository) CreateUserTemplate(ctx context.Context, template *models.UserTemplate) error {
	result := r.db.DB.WithContext(ctx).Create(template)
	return r.handleDBError(result.Error, "user template", "create user template")
}

func (r *importRepository) UpdateUserTemplate(ctx context.Context, template *models.UserTemplate) error {
	result := r.db.DB.WithContext(ctx).Save(template)
	return r.handleDBError(result.Error, "user template", "update user template")
}

func (r *importRepository) DeleteUserTemplate(ctx context.Context, id int32, userID int32) error {
	result := r.db.DB.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).Delete(&models.UserTemplate{})
	if result.RowsAffected == 0 {
		return r.handleDBError(nil, "user template", "user template not found or not owned by user")
	}
	return r.handleDBError(result.Error, "user template", "delete user template")
}
