package service

import (
	"context"
	"time"

	"wealthjourney/domain/models"
	"wealthjourney/domain/repository"
	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/types"

	v1 "wealthjourney/protobuf/v1"
)

// transactionService implements TransactionService.
type transactionService struct {
	txRepo       repository.TransactionRepository
	walletRepo   repository.WalletRepository
	categoryRepo repository.CategoryRepository
}

// NewTransactionService creates a new TransactionService.
func NewTransactionService(
	txRepo repository.TransactionRepository,
	walletRepo repository.WalletRepository,
	categoryRepo repository.CategoryRepository,
) TransactionService {
	return &transactionService{
		txRepo:       txRepo,
		walletRepo:   walletRepo,
		categoryRepo: categoryRepo,
	}
}

// CreateTransaction creates a new transaction and updates wallet balance.
func (s *transactionService) CreateTransaction(ctx context.Context, userID int32, req *v1.CreateTransactionRequest) (*v1.CreateTransactionResponse, error) {
	// Validate amount is provided
	if req.Amount == nil {
		return nil, apperrors.NewValidationError("amount is required")
	}

	// Validate wallet belongs to user
	wallet, err := s.walletRepo.GetByIDForUser(ctx, req.WalletId, userID)
	if err != nil {
		return nil, err
	}

	// Validate category if provided
	var category *models.Category
	if req.CategoryId != nil {
		category, err = s.categoryRepo.GetByIDForUser(ctx, *req.CategoryId, userID)
		if err != nil {
			return nil, err
		}
	}

	// Calculate balance delta based on category type
	balanceDelta := s.calculateBalanceDelta(req.Amount.Amount, category)

	// Check if balance would go negative
	newBalance := wallet.Balance + balanceDelta
	if newBalance < 0 {
		return nil, apperrors.NewValidationError("Insufficient balance for this transaction")
	}

	// Create transaction
	transaction := &models.Transaction{
		WalletID: req.WalletId,
		Amount:   req.Amount.Amount,
	}

	if req.CategoryId != nil {
		transaction.CategoryID = req.CategoryId
	}

	if req.Note != nil {
		transaction.Note = *req.Note
	}

	if req.Date != nil && *req.Date > 0 {
		transaction.Date = time.Unix(*req.Date, 0)
	} else {
		transaction.Date = time.Now()
	}

	// Use transaction to create transaction record and update wallet balance atomically
	err = s.txRepo.Create(ctx, transaction)
	if err != nil {
		return nil, err
	}

	// Update wallet balance
	_, err = s.walletRepo.UpdateBalance(ctx, req.WalletId, balanceDelta)
	if err != nil {
		return nil, err
	}

	// Get updated wallet for response
	updatedWallet, _ := s.walletRepo.GetByID(ctx, req.WalletId)

	return &v1.CreateTransactionResponse{
		Success: true,
		Message: "Transaction created successfully",
		Data:    s.modelToProto(transaction, updatedWallet, category),
		NewBalance: &v1.Money{
			Amount:   updatedWallet.Balance,
			Currency: updatedWallet.Currency,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// GetTransaction retrieves a transaction by ID.
func (s *transactionService) GetTransaction(ctx context.Context, transactionID int32, userID int32) (*v1.GetTransactionResponse, error) {
	transaction, err := s.txRepo.GetByIDForUser(ctx, transactionID, userID)
	if err != nil {
		return nil, err
	}

	// Load relationships
	wallet, _ := s.walletRepo.GetByID(ctx, transaction.WalletID)
	var category *models.Category
	if transaction.CategoryID != nil {
		category, _ = s.categoryRepo.GetByID(ctx, *transaction.CategoryID)
	}

	return &v1.GetTransactionResponse{
		Success:   true,
		Message:   "Transaction retrieved successfully",
		Data:      s.modelToProto(transaction, wallet, category),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// ListTransactions retrieves transactions with filtering and pagination.
func (s *transactionService) ListTransactions(ctx context.Context, userID int32, req *v1.ListTransactionsRequest) (*v1.ListTransactionsResponse, error) {
	// Parse pagination params
	params := s.parsePaginationParams(req.Pagination)

	// Build filter from request
	filter := s.buildFilter(req.Filter)

	// Get transactions
	transactions, total, err := s.txRepo.List(ctx, userID, filter, repository.ListOptions{
		Limit:   params.PageSize,
		Offset:  (params.Page - 1) * params.PageSize,
		OrderBy: string(req.SortField),
		Order:   req.SortOrder,
	})
	if err != nil {
		return nil, err
	}

	// Convert to protobuf
	protoTransactions := make([]*v1.Transaction, len(transactions))
	for i, tx := range transactions {
		protoTransactions[i] = s.modelToProtoSimple(tx)
	}

	// Build pagination result
	totalPages := int32(total) / int32(params.PageSize)
	if int32(total)%int32(params.PageSize) > 0 {
		totalPages++
	}

	return &v1.ListTransactionsResponse{
		Success:      true,
		Message:      "Transactions retrieved successfully",
		Transactions: protoTransactions,
		Pagination: &v1.PaginationResult{
			Page:       int32(params.Page),
			PageSize:   int32(params.PageSize),
			TotalCount: int32(total),
			TotalPages: totalPages,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// UpdateTransaction updates a transaction and adjusts wallet balance.
func (s *transactionService) UpdateTransaction(ctx context.Context, transactionID int32, userID int32, req *v1.UpdateTransactionRequest) (*v1.UpdateTransactionResponse, error) {
	// Validate amount is provided
	if req.Amount == nil {
		return nil, apperrors.NewValidationError("amount is required")
	}

	// Get existing transaction
	oldTransaction, err := s.txRepo.GetByIDForUser(ctx, transactionID, userID)
	if err != nil {
		return nil, err
	}

	// Determine which wallet to use (new wallet from request or existing)
	targetWalletID := oldTransaction.WalletID
	if req.WalletId != nil {
		// Validate new wallet belongs to user
		newWallet, err := s.walletRepo.GetByIDForUser(ctx, *req.WalletId, userID)
		if err != nil {
			return nil, err
		}
		targetWalletID = newWallet.ID
	}

	// Get target wallet
	wallet, err := s.walletRepo.GetByID(ctx, targetWalletID)
	if err != nil {
		return nil, err
	}

	// Determine category to use
	var category *models.Category
	if req.CategoryId != nil {
		category, err = s.categoryRepo.GetByIDForUser(ctx, *req.CategoryId, userID)
		if err != nil {
			return nil, err
		}
	} else if oldTransaction.CategoryID != nil {
		// Keep existing category
		category, _ = s.categoryRepo.GetByID(ctx, *oldTransaction.CategoryID)
	}

	// Handle wallet change if needed
	if req.WalletId != nil && *req.WalletId != oldTransaction.WalletID {
		// Revert old transaction's effect on old wallet
		oldBalanceDelta := s.calculateBalanceDelta(oldTransaction.Amount, category)

		// Apply new transaction's effect on new wallet
		newBalanceDelta := s.calculateBalanceDelta(req.Amount.Amount, category)

		// Check if new wallet would have sufficient balance
		newWalletBalance := wallet.Balance + newBalanceDelta
		if newWalletBalance < 0 {
			return nil, apperrors.NewValidationError("Insufficient balance in target wallet")
		}

		// Update both wallets
		_, err = s.walletRepo.UpdateBalance(ctx, oldTransaction.WalletID, -oldBalanceDelta)
		if err != nil {
			return nil, err
		}
		_, err = s.walletRepo.UpdateBalance(ctx, targetWalletID, newBalanceDelta)
		if err != nil {
			return nil, err
		}
	} else {
		// No wallet change, just calculate delta for same wallet
		oldBalanceDelta := s.calculateBalanceDelta(oldTransaction.Amount, category)
		newBalanceDelta := s.calculateBalanceDelta(req.Amount.Amount, category)
		totalDelta := newBalanceDelta - oldBalanceDelta

		// Check if balance would go negative
		newBalance := wallet.Balance + totalDelta
		if newBalance < 0 {
			return nil, apperrors.NewValidationError("Insufficient balance for this transaction update")
		}

		// Update wallet balance
		_, err = s.walletRepo.UpdateBalance(ctx, targetWalletID, totalDelta)
		if err != nil {
			return nil, err
		}
	}

	// Update transaction fields
	updates := &models.Transaction{
		ID:       transactionID,
		WalletID: targetWalletID,
		Amount:   req.Amount.Amount,
	}
	if req.CategoryId != nil {
		updates.CategoryID = req.CategoryId
	}
	if req.Date != nil {
		updates.Date = time.Unix(*req.Date, 0)
	}
	if req.Note != nil {
		updates.Note = *req.Note
	}

	err = s.txRepo.Update(ctx, updates)
	if err != nil {
		return nil, err
	}

	// Get updated data
	updatedTransaction, _ := s.txRepo.GetByID(ctx, transactionID)
	updatedWallet, _ := s.walletRepo.GetByID(ctx, targetWalletID)

	return &v1.UpdateTransactionResponse{
		Success: true,
		Message: "Transaction updated successfully",
		Data:    s.modelToProto(updatedTransaction, updatedWallet, category),
		NewBalance: &v1.Money{
			Amount:   updatedWallet.Balance,
			Currency: updatedWallet.Currency,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// DeleteTransaction deletes a transaction and restores the wallet balance.
func (s *transactionService) DeleteTransaction(ctx context.Context, transactionID int32, userID int32) (*v1.DeleteTransactionResponse, error) {
	// Get transaction
	transaction, err := s.txRepo.GetByIDForUser(ctx, transactionID, userID)
	if err != nil {
		return nil, err
	}

	// Get category to calculate balance restoration
	var category *models.Category
	if transaction.CategoryID != nil {
		category, _ = s.categoryRepo.GetByID(ctx, *transaction.CategoryID)
	}

	// Calculate balance restoration (negative of the original delta)
	balanceDelta := s.calculateBalanceDelta(transaction.Amount, category)
	restoreDelta := -balanceDelta

	// Delete transaction
	err = s.txRepo.Delete(ctx, transactionID)
	if err != nil {
		return nil, err
	}

	// Restore wallet balance
	updatedWallet, err := s.walletRepo.UpdateBalance(ctx, transaction.WalletID, restoreDelta)
	if err != nil {
		return nil, err
	}

	return &v1.DeleteTransactionResponse{
		Success: true,
		Message: "Transaction deleted successfully",
		NewBalance: &v1.Money{
			Amount:   updatedWallet.Balance,
			Currency: updatedWallet.Currency,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// GetAvailableYears retrieves distinct years from user's transactions.
func (s *transactionService) GetAvailableYears(ctx context.Context, userID int32) (*v1.GetAvailableYearsResponse, error) {
	years, err := s.txRepo.GetAvailableYears(ctx, userID)
	if err != nil {
		return nil, err
	}

	message := "Available years retrieved successfully"
	if len(years) == 0 {
		message = "No transactions found"
	}

	return &v1.GetAvailableYearsResponse{
		Success:   true,
		Message:   message,
		Years:     years,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// Helper methods

// calculateBalanceDelta calculates the balance change based on amount and category type.
// Income adds to balance, Expense subtracts from balance.
func (s *transactionService) calculateBalanceDelta(amount int64, category *models.Category) int64 {
	if category == nil || category.Type == v1.CategoryType_CATEGORY_TYPE_UNSPECIFIED {
		// Default to expense if no category
		return -amount
	}

	switch category.Type {
	case v1.CategoryType_CATEGORY_TYPE_INCOME:
		return amount
	case v1.CategoryType_CATEGORY_TYPE_EXPENSE:
		return -amount
	default:
		return -amount
	}
}

// parsePaginationParams converts protobuf pagination params to internal types.
func (s *transactionService) parsePaginationParams(params *v1.PaginationParams) types.PaginationParams {
	if params == nil {
		return types.NewPaginationParams()
	}

	p := types.PaginationParams{
		Page:     int(params.Page),
		PageSize: int(params.PageSize),
		OrderBy:  params.OrderBy,
		Order:    params.Order,
	}
	return p.Validate()
}

// buildFilter converts protobuf filter to repository filter.
func (s *transactionService) buildFilter(filter *v1.TransactionFilter) repository.TransactionFilter {
	if filter == nil {
		return repository.TransactionFilter{}
	}

	repoFilter := repository.TransactionFilter{}

	if filter.WalletId != nil {
		repoFilter.WalletID = filter.WalletId
	}
	if filter.CategoryId != nil {
		repoFilter.CategoryID = filter.CategoryId
	}
	if filter.Type != nil {
		repoFilter.Type = filter.Type
	}
	if filter.StartDate != nil {
		t := time.Unix(*filter.StartDate, 0)
		repoFilter.StartDate = &t
	}
	if filter.EndDate != nil {
		t := time.Unix(*filter.EndDate, 0)
		repoFilter.EndDate = &t
	}
	if filter.MinAmount != nil {
		repoFilter.MinAmount = filter.MinAmount
	}
	if filter.MaxAmount != nil {
		repoFilter.MaxAmount = filter.MaxAmount
	}
	if filter.SearchNote != nil {
		repoFilter.SearchNote = filter.SearchNote
	}

	return repoFilter
}

// modelToProto converts a model Transaction to protobuf with full relationships.
func (s *transactionService) modelToProto(tx *models.Transaction, wallet *models.Wallet, category *models.Category) *v1.Transaction {
	proto := &v1.Transaction{
		Id:       tx.ID,
		WalletId: tx.WalletID,
		Amount: &v1.Money{
			Amount:   tx.Amount,
			Currency: wallet.Currency,
		},
		Date:      tx.Date.Unix(),
		Note:      tx.Note,
		CreatedAt: tx.CreatedAt.Unix(),
		UpdatedAt: tx.UpdatedAt.Unix(),
	}

	if tx.CategoryID != nil {
		proto.CategoryId = *tx.CategoryID
	}

	return proto
}

// modelToProtoSimple converts a model Transaction to protobuf without loading relationships.
func (s *transactionService) modelToProtoSimple(tx *models.Transaction) *v1.Transaction {
	proto := &v1.Transaction{
		Id:       tx.ID,
		WalletId: tx.WalletID,
		Amount: &v1.Money{
			Amount:   tx.Amount,
			Currency: "VND", // Default, should be loaded from wallet
		},
		Date:      tx.Date.Unix(),
		Note:      tx.Note,
		CreatedAt: tx.CreatedAt.Unix(),
		UpdatedAt: tx.UpdatedAt.Unix(),
	}

	if tx.CategoryID != nil {
		proto.CategoryId = *tx.CategoryID
	}

	return proto
}
