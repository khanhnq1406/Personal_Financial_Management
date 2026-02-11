package service

import (
	"context"
	"fmt"
	"time"

	"wealthjourney/domain/models"
	"wealthjourney/domain/repository"
	apperrors "wealthjourney/pkg/errors"
	v1 "wealthjourney/protobuf/v1"

	"github.com/google/uuid"
)

// ImportService defines the interface for import business logic.
type ImportService interface {
	// ExecuteImport executes the import of transactions with duplicate handling.
	ExecuteImport(ctx context.Context, userID int32, req *v1.ExecuteImportRequest) (*v1.ExecuteImportResponse, error)

	// UndoImport undoes an import within 24 hours of creation.
	UndoImport(ctx context.Context, userID int32, importID string) (*v1.UndoImportResponse, error)

	// GetImportHistory retrieves import history for a user.
	GetImportHistory(ctx context.Context, userID int32, req *v1.GetImportHistoryRequest) (*v1.GetImportHistoryResponse, error)
}

type importService struct {
	importRepo      repository.ImportRepository
	transactionRepo repository.TransactionRepository
	walletRepo      repository.WalletRepository
	categoryRepo    repository.CategoryRepository
}

// NewImportService creates a new ImportService.
func NewImportService(
	importRepo repository.ImportRepository,
	transactionRepo repository.TransactionRepository,
	walletRepo repository.WalletRepository,
	categoryRepo repository.CategoryRepository,
) ImportService {
	return &importService{
		importRepo:      importRepo,
		transactionRepo: transactionRepo,
		walletRepo:      walletRepo,
		categoryRepo:    categoryRepo,
	}
}

// ExecuteImport executes the import of transactions with duplicate handling.
func (s *importService) ExecuteImport(ctx context.Context, userID int32, req *v1.ExecuteImportRequest) (*v1.ExecuteImportResponse, error) {
	// Validate wallet ownership
	wallet, err := s.walletRepo.GetByIDForUser(ctx, req.WalletId, userID)
	if err != nil {
		return nil, err
	}

	// Filter out excluded and invalid transactions
	var validTransactions []*v1.ParsedTransaction
	excludedMap := make(map[int32]bool)
	for _, rowNum := range req.ExcludedRowNumbers {
		excludedMap[rowNum] = true
	}

	for _, tx := range req.Transactions {
		// Skip excluded rows
		if excludedMap[tx.RowNumber] {
			continue
		}
		// Skip invalid transactions
		if !tx.IsValid {
			continue
		}
		validTransactions = append(validTransactions, tx)
	}

	if len(validTransactions) == 0 {
		return nil, apperrors.NewValidationError("No valid transactions to import")
	}

	// Convert parsed transactions to models
	var transactionsToCreate []*models.Transaction
	var totalIncome, totalExpenses int64
	var minDate, maxDate time.Time

	for _, parsedTx := range validTransactions {
		// Convert Unix timestamp to time.Time
		txDate := time.Unix(parsedTx.Date, 0)

		// Track date range
		if minDate.IsZero() || txDate.Before(minDate) {
			minDate = txDate
		}
		if maxDate.IsZero() || txDate.After(maxDate) {
			maxDate = txDate
		}

		// Get or create category
		var categoryID *int32
		if parsedTx.SuggestedCategoryId > 0 {
			// Verify category exists and belongs to user
			_, err := s.categoryRepo.GetByIDForUser(ctx, parsedTx.SuggestedCategoryId, userID)
			if err == nil {
				categoryID = &parsedTx.SuggestedCategoryId
			}
		}

		// Calculate amount (stored in smallest currency unit)
		amount := parsedTx.Amount.Amount

		// Track income/expenses
		if amount > 0 {
			totalIncome += amount
		} else {
			totalExpenses += -amount // Store as positive for summary
		}

		transaction := &models.Transaction{
			WalletID:   req.WalletId,
			CategoryID: categoryID,
			Amount:     amount,
			Currency:   parsedTx.Amount.Currency,
			Date:       txDate,
			Note:       parsedTx.Description,
		}

		transactionsToCreate = append(transactionsToCreate, transaction)
	}

	// Create import batch record
	batchID := uuid.New().String()
	now := time.Now()
	undoExpiresAt := now.Add(24 * time.Hour)

	importBatch := &models.ImportBatch{
		ID:                batchID,
		UserID:            userID,
		WalletID:          req.WalletId,
		FileName:          fmt.Sprintf("import-%s", req.FileId),
		FileType:          "csv",
		ImportedAt:        now,
		TotalRows:         int32(len(req.Transactions)),
		ValidRows:         int32(len(validTransactions)),
		SkippedRows:       int32(len(req.Transactions) - len(validTransactions)),
		DuplicatesMerged:  0,
		DuplicatesSkipped: 0,
		TotalIncome:       totalIncome,
		TotalExpenses:     totalExpenses,
		NetChange:         totalIncome - totalExpenses,
		DateRangeStart:    minDate,
		DateRangeEnd:      maxDate,
		CanUndo:           true,
		UndoExpiresAt:     undoExpiresAt,
	}

	// Create import batch
	if err := s.importRepo.CreateImportBatch(ctx, importBatch); err != nil {
		return nil, err
	}

	// Bulk create transactions atomically
	createdIDs, err := s.transactionRepo.BulkCreate(ctx, transactionsToCreate)
	if err != nil {
		return nil, err
	}

	// Link transactions to import batch
	if err := s.importRepo.LinkTransactionsToImport(ctx, batchID, createdIDs); err != nil {
		return nil, err
	}

	// Get updated wallet balance
	wallet, err = s.walletRepo.GetByID(ctx, req.WalletId)
	if err != nil {
		return nil, err
	}

	// Build response
	return &v1.ExecuteImportResponse{
		Success:       true,
		Message:       fmt.Sprintf("Successfully imported %d transactions", len(createdIDs)),
		ImportBatchId: batchID,
		Summary: &v1.ImportSummary{
			TotalImported:     int32(len(createdIDs)),
			TotalSkipped:      importBatch.SkippedRows,
			DuplicatesMerged:  importBatch.DuplicatesMerged,
			DuplicatesSkipped: importBatch.DuplicatesSkipped,
			TotalIncome: &v1.Money{
				Amount:   totalIncome,
				Currency: wallet.Currency,
			},
			TotalExpenses: &v1.Money{
				Amount:   totalExpenses,
				Currency: wallet.Currency,
			},
			NetChange: &v1.Money{
				Amount:   totalIncome - totalExpenses,
				Currency: wallet.Currency,
			},
			NewWalletBalance: &v1.Money{
				Amount:   wallet.Balance,
				Currency: wallet.Currency,
			},
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// UndoImport undoes an import within 24 hours of creation.
func (s *importService) UndoImport(ctx context.Context, userID int32, importID string) (*v1.UndoImportResponse, error) {
	// Get import batch
	batch, err := s.importRepo.GetImportBatchByID(ctx, importID)
	if err != nil {
		return nil, err
	}

	// Verify ownership
	if batch.UserID != userID {
		return nil, apperrors.NewNotFoundError("import batch")
	}

	// Check if undo is allowed
	if !batch.CanUndo {
		return nil, apperrors.NewValidationError("This import cannot be undone")
	}

	// Check if already undone
	if batch.UndoneAt != nil {
		return nil, apperrors.NewValidationError("This import has already been undone")
	}

	// Check if undo window has expired
	if time.Now().After(batch.UndoExpiresAt) {
		return nil, apperrors.NewValidationError("Undo window has expired (24 hours)")
	}

	// Get transactions for this import
	transactions, err := s.importRepo.GetTransactionsByImportBatchID(ctx, importID)
	if err != nil {
		return nil, err
	}

	// Calculate total reversal amount by wallet
	walletReversals := make(map[int32]int64)
	for _, tx := range transactions {
		walletReversals[tx.WalletID] += -tx.Amount
	}

	// Delete transactions
	for _, tx := range transactions {
		if err := s.transactionRepo.Delete(ctx, tx.ID); err != nil {
			return nil, fmt.Errorf("failed to delete transaction: %w", err)
		}
	}

	// Update wallet balances
	for walletID, delta := range walletReversals {
		if _, err := s.walletRepo.UpdateBalance(ctx, walletID, delta); err != nil {
			return nil, fmt.Errorf("failed to update wallet balance: %w", err)
		}
	}

	// Mark import batch as undone
	now := time.Now()
	batch.UndoneAt = &now
	batch.CanUndo = false
	if err := s.importRepo.UpdateImportBatch(ctx, batch); err != nil {
		return nil, err
	}

	return &v1.UndoImportResponse{
		Success:   true,
		Message:   fmt.Sprintf("Successfully undone import of %d transactions", len(transactions)),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// GetImportHistory retrieves import history for a user.
func (s *importService) GetImportHistory(ctx context.Context, userID int32, req *v1.GetImportHistoryRequest) (*v1.GetImportHistoryResponse, error) {
	// Convert pagination params
	opts := repository.ListOptions{
		Limit:   int(req.Pagination.PageSize),
		Offset:  int((req.Pagination.Page - 1) * req.Pagination.PageSize),
		OrderBy: req.Pagination.OrderBy,
		Order:   req.Pagination.Order,
	}

	// Get import batches
	batches, total, err := s.importRepo.ListImportBatchesByUserID(ctx, userID, opts)
	if err != nil {
		return nil, err
	}

	// Convert to protobuf format
	pbBatches := make([]*v1.ImportBatch, 0, len(batches))
	for _, batch := range batches {
		pbBatch := &v1.ImportBatch{
			Id:           batch.ID,
			UserId:       batch.UserID,
			WalletId:     batch.WalletID,
			FileName:     batch.FileName,
			FileType:     batch.FileType,
			BankTemplate: batch.BankTemplate,
			ImportedAt:   batch.ImportedAt.Unix(),
			Summary: &v1.ImportSummary{
				TotalImported:     batch.ValidRows,
				TotalSkipped:      batch.SkippedRows,
				DuplicatesMerged:  batch.DuplicatesMerged,
				DuplicatesSkipped: batch.DuplicatesSkipped,
				TotalIncome: &v1.Money{
					Amount:   batch.TotalIncome,
					Currency: "VND", // Default currency, should get from wallet
				},
				TotalExpenses: &v1.Money{
					Amount:   batch.TotalExpenses,
					Currency: "VND",
				},
				NetChange: &v1.Money{
					Amount:   batch.NetChange,
					Currency: "VND",
				},
			},
			CanUndo:       batch.CanUndo && batch.UndoneAt == nil && time.Now().Before(batch.UndoExpiresAt),
			UndoExpiresAt: batch.UndoExpiresAt.Unix(),
		}
		pbBatches = append(pbBatches, pbBatch)
	}

	// Calculate pagination result
	totalPages := int32(total) / req.Pagination.PageSize
	if int32(total)%req.Pagination.PageSize > 0 {
		totalPages++
	}

	return &v1.GetImportHistoryResponse{
		Success: true,
		Message: fmt.Sprintf("Retrieved %d import batches", len(batches)),
		Batches: pbBatches,
		Pagination: &v1.PaginationResult{
			Page:       req.Pagination.Page,
			PageSize:   req.Pagination.PageSize,
			TotalCount: int32(total),
			TotalPages: totalPages,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}
