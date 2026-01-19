package repository

import (
	"context"
	"errors"

	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/database"

	"gorm.io/gorm"
)

// BaseRepository provides common functionality for all repositories
type BaseRepository struct {
	db *database.Database
}

// NewBaseRepository creates a new base repository
func NewBaseRepository(db *database.Database) *BaseRepository {
	return &BaseRepository{db: db}
}

// handleDBError converts GORM errors to application errors
func (r *BaseRepository) handleDBError(err error, entityName, operation string) error {
	if err == nil {
		return nil
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return apperrors.NewNotFoundError(entityName)
	}

	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return apperrors.NewConflictErrorWithCause(entityName+" already exists", err)
	}

	return apperrors.NewInternalErrorWithCause("failed to "+operation, err)
}

// buildOrderClause constructs an SQL order clause from options
func (r *BaseRepository) buildOrderClause(opts ListOptions) string {
	// Default order by created_at desc
	direction := "desc"
	if opts.Order == "asc" {
		direction = "asc"
	}

	// Validate and sanitize OrderBy to prevent SQL injection
	// Only allow alphanumeric characters and underscores
	if opts.OrderBy == "" {
		return "created_at " + direction
	}

	// Basic validation - only allow safe column names
	allowedColumns := map[string]bool{
		"id":          true,
		"created_at":  true,
		"updated_at":  true,
		"date":        true,
		"amount":      true,
		"name":        true,
		"balance":     true,
		"wallet_name": true,
		"total":       true,
	}

	if !allowedColumns[opts.OrderBy] {
		return "created_at " + direction
	}

	return opts.OrderBy + " " + direction
}

// applyPagination applies limit and offset to a query
func (r *BaseRepository) applyPagination(query *gorm.DB, opts ListOptions) *gorm.DB {
	if opts.Limit > 0 {
		query = query.Limit(opts.Limit)
	}
	if opts.Offset > 0 {
		query = query.Offset(opts.Offset)
	}
	return query
}

// executeCreate executes a create operation with error handling
func (r *BaseRepository) executeCreate(ctx context.Context, entity interface{}, entityName string) error {
	result := r.db.DB.WithContext(ctx).Create(entity)
	return r.handleDBError(result.Error, entityName, "create "+entityName)
}

// executeGetByID executes a get by ID operation with error handling
func (r *BaseRepository) executeGetByID(ctx context.Context, dest interface{}, id int32, entityName string) error {
	result := r.db.DB.WithContext(ctx).First(dest, id)
	return r.handleDBError(result.Error, entityName, "get "+entityName)
}

// executeUpdate executes an update operation with error handling
func (r *BaseRepository) executeUpdate(ctx context.Context, entity interface{}, entityName string) error {
	result := r.db.DB.WithContext(ctx).Save(entity)
	if result.Error != nil {
		return apperrors.NewInternalErrorWithCause("failed to update "+entityName, result.Error)
	}
	return nil
}

// executeDelete executes a delete operation with error handling and row count check
func (r *BaseRepository) executeDelete(ctx context.Context, model interface{}, id int32, entityName string) error {
	result := r.db.DB.WithContext(ctx).Delete(model, id)
	if result.Error != nil {
		return apperrors.NewInternalErrorWithCause("failed to delete "+entityName, result.Error)
	}
	if result.RowsAffected == 0 {
		return apperrors.NewNotFoundError(entityName)
	}
	return nil
}
