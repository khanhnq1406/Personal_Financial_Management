package service

import (
	"context"
	"fmt"
	"time"

	"wealthjourney/domain/models"
	"wealthjourney/domain/repository"
	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/types"
	"wealthjourney/pkg/validator"
	walletv1 "wealthjourney/protobuf/v1"
)

// walletService implements WalletService.
type walletService struct {
	walletRepo   repository.WalletRepository
	userRepo     repository.UserRepository
	txRepo       repository.TransactionRepository
	categoryRepo repository.CategoryRepository
	mapper       *WalletMapper
}

// NewWalletService creates a new WalletService.
func NewWalletService(
	walletRepo repository.WalletRepository,
	userRepo repository.UserRepository,
	txRepo repository.TransactionRepository,
	categoryRepo repository.CategoryRepository,
) WalletService {
	return &walletService{
		walletRepo:   walletRepo,
		userRepo:     userRepo,
		txRepo:       txRepo,
		categoryRepo: categoryRepo,
		mapper:       NewWalletMapper(),
	}
}

// CreateWallet creates a new wallet for a user.
func (s *walletService) CreateWallet(ctx context.Context, userID int32, req *walletv1.CreateWalletRequest) (*walletv1.CreateWalletResponse, error) {
	// Validate inputs
	if err := validator.ID(userID); err != nil {
		return nil, err
	}
	if err := validator.WalletName(req.WalletName); err != nil {
		return nil, err
	}

	// Verify user exists
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, apperrors.NewNotFoundError("user")
	}

	// Validate initial balance
	initialBalance := int64(0)
	currency := types.USD
	if req.InitialBalance != nil {
		initialBalance = req.InitialBalance.Amount
		currency = req.InitialBalance.Currency
		if initialBalance < 0 {
			return nil, apperrors.NewValidationError("initial balance cannot be negative")
		}
	}

	// Create wallet model
	wallet := &models.Wallet{
		UserID:     userID,
		WalletName: req.WalletName,
		Balance:    initialBalance,
		Currency:   currency,
		Type:       req.Type,
	}

	if err := s.walletRepo.Create(ctx, wallet); err != nil {
		return nil, err
	}

	return &walletv1.CreateWalletResponse{
		Success:   true,
		Message:   "Wallet created successfully",
		Data:      s.mapper.ModelToProto(wallet),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// GetWallet retrieves a wallet by ID, ensuring it belongs to the user.
func (s *walletService) GetWallet(ctx context.Context, walletID int32, requestingUserID int32) (*walletv1.GetWalletResponse, error) {
	if err := validator.ID(walletID); err != nil {
		return nil, err
	}
	if err := validator.ID(requestingUserID); err != nil {
		return nil, err
	}

	wallet, err := s.walletRepo.GetByIDForUser(ctx, walletID, requestingUserID)
	if err != nil {
		return nil, err
	}

	return &walletv1.GetWalletResponse{
		Success:   true,
		Message:   "Wallet retrieved successfully",
		Data:      s.mapper.ModelToProto(wallet),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// ListWallets retrieves all wallets for a user with pagination.
func (s *walletService) ListWallets(ctx context.Context, userID int32, params types.PaginationParams) (*walletv1.ListWalletsResponse, error) {
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	params = params.Validate()

	opts := repository.ListOptions{
		Limit:   params.Limit(),
		Offset:  params.Offset(),
		OrderBy: params.OrderBy,
		Order:   params.Order,
	}

	wallets, total, err := s.walletRepo.ListByUserID(ctx, userID, opts)
	if err != nil {
		return nil, err
	}

	protoWallets := s.mapper.ModelSliceToProto(wallets)
	paginationResult := types.NewPaginationResult(params.Page, params.PageSize, total)

	return &walletv1.ListWalletsResponse{
		Success:    true,
		Message:    "Wallets retrieved successfully",
		Wallets:    protoWallets,
		Pagination: s.mapper.PaginationResultToProto(paginationResult),
		Timestamp:  time.Now().Format(time.RFC3339),
	}, nil
}

// UpdateWallet updates a wallet's name.
func (s *walletService) UpdateWallet(ctx context.Context, walletID int32, userID int32, req *walletv1.UpdateWalletRequest) (*walletv1.UpdateWalletResponse, error) {
	if err := validator.ID(walletID); err != nil {
		return nil, err
	}
	if err := validator.ID(userID); err != nil {
		return nil, err
	}
	if err := validator.WalletName(req.WalletName); err != nil {
		return nil, err
	}

	// Get wallet and verify ownership
	wallet, err := s.walletRepo.GetByIDForUser(ctx, walletID, userID)
	if err != nil {
		return nil, err
	}

	// Update name
	wallet.WalletName = req.WalletName

	if err := s.walletRepo.Update(ctx, wallet); err != nil {
		return nil, err
	}

	return &walletv1.UpdateWalletResponse{
		Success:   true,
		Message:   "Wallet updated successfully",
		Data:      s.mapper.ModelToProto(wallet),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// DeleteWallet deletes a wallet.
func (s *walletService) DeleteWallet(ctx context.Context, walletID int32, userID int32) (*walletv1.DeleteWalletResponse, error) {
	if err := validator.ID(walletID); err != nil {
		return nil, err
	}
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Verify ownership
	_, err := s.walletRepo.GetByIDForUser(ctx, walletID, userID)
	if err != nil {
		return nil, err
	}

	if err := s.walletRepo.Delete(ctx, walletID); err != nil {
		return nil, err
	}

	return &walletv1.DeleteWalletResponse{
		Success:   true,
		Message:   "Wallet deleted successfully",
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// AddFunds adds funds to a wallet.
func (s *walletService) AddFunds(ctx context.Context, walletID int32, userID int32, req *walletv1.AddFundsRequest) (*walletv1.AddFundsResponse, error) {
	if err := validator.ID(walletID); err != nil {
		return nil, err
	}
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Verify ownership
	wallet, err := s.walletRepo.GetByIDForUser(ctx, walletID, userID)
	if err != nil {
		return nil, err
	}

	// Validate amount
	if req.Amount == nil || req.Amount.Amount <= 0 {
		return nil, apperrors.NewValidationError("amount must be positive")
	}
	if req.Amount.Currency != wallet.Currency {
		return nil, apperrors.NewValidationError("currency mismatch")
	}

	// Update balance
	updated, err := s.walletRepo.UpdateBalance(ctx, walletID, req.Amount.Amount)
	if err != nil {
		return nil, err
	}

	return &walletv1.AddFundsResponse{
		Success:   true,
		Message:   "Funds added successfully",
		Data:      s.mapper.ModelToProto(updated),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// WithdrawFunds withdraws funds from a wallet.
func (s *walletService) WithdrawFunds(ctx context.Context, walletID int32, userID int32, req *walletv1.WithdrawFundsRequest) (*walletv1.WithdrawFundsResponse, error) {
	if err := validator.ID(walletID); err != nil {
		return nil, err
	}
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Verify ownership
	wallet, err := s.walletRepo.GetByIDForUser(ctx, walletID, userID)
	if err != nil {
		return nil, err
	}

	// Validate amount
	if req.Amount == nil || req.Amount.Amount <= 0 {
		return nil, apperrors.NewValidationError("amount must be positive")
	}
	if req.Amount.Currency != wallet.Currency {
		return nil, apperrors.NewValidationError("currency mismatch")
	}

	// Check sufficient balance
	if wallet.Balance < req.Amount.Amount {
		return nil, apperrors.NewValidationError("Insufficient balance")
	}

	// Update balance (negative delta for withdrawal)
	updated, err := s.walletRepo.UpdateBalance(ctx, walletID, -req.Amount.Amount)
	if err != nil {
		return nil, err
	}

	return &walletv1.WithdrawFundsResponse{
		Success:   true,
		Message:   "Funds withdrawn successfully",
		Data:      s.mapper.ModelToProto(updated),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// TransferFunds transfers funds between two wallets belonging to the same user.
// It also creates two transactions: one for the outgoing transfer (expense) and one for the incoming transfer (income).
func (s *walletService) TransferFunds(ctx context.Context, userID int32, req *walletv1.TransferFundsRequest) (*walletv1.TransferFundsResponse, error) {
	if err := validator.ID(userID); err != nil {
		return nil, err
	}
	if req.FromWalletId == req.ToWalletId {
		return nil, apperrors.NewValidationError("source and destination wallets cannot be the same")
	}

	// Verify both wallets exist and belong to user
	fromWallet, err := s.walletRepo.GetByIDForUser(ctx, req.FromWalletId, userID)
	if err != nil {
		return nil, err
	}

	toWallet, err := s.walletRepo.GetByIDForUser(ctx, req.ToWalletId, userID)
	if err != nil {
		return nil, err
	}

	// Validate amount
	if req.Amount == nil || req.Amount.Amount <= 0 {
		return nil, apperrors.NewValidationError("amount must be positive")
	}
	if req.Amount.Currency != fromWallet.Currency {
		return nil, apperrors.NewValidationError("currency mismatch with source wallet")
	}
	if toWallet.Currency != fromWallet.Currency {
		return nil, apperrors.NewValidationError("wallets must have the same currency")
	}

	// Check sufficient balance
	if fromWallet.Balance < req.Amount.Amount {
		return nil, apperrors.NewValidationError("Insufficient balance")
	}

	// Find or create "Outgoing Transfer" category (expense)
	outgoingCategory, err := s.categoryRepo.GetByNameAndType(ctx, userID, "Outgoing Transfer", walletv1.CategoryType_CATEGORY_TYPE_EXPENSE)
	if err != nil {
		return nil, apperrors.NewInternalErrorWithCause("failed to get outgoing transfer category", err)
	}

	// Find or create "Incoming Transfer" category (income)
	incomingCategory, err := s.categoryRepo.GetByNameAndType(ctx, userID, "Incoming Transfer", walletv1.CategoryType_CATEGORY_TYPE_INCOME)
	if err != nil {
		return nil, apperrors.NewInternalErrorWithCause("failed to get incoming transfer category", err)
	}

	// Create outgoing transaction (expense) for source wallet
	outgoingTx := &models.Transaction{
		WalletID:   req.FromWalletId,
		CategoryID: &outgoingCategory.ID,
		Amount:     req.Amount.Amount,
		Date:       time.Now(),
		Note:       fmt.Sprintf("Transfer to wallet: %s", toWallet.WalletName),
	}

	// Create incoming transaction (income) for destination wallet
	incomingTx := &models.Transaction{
		WalletID:   req.ToWalletId,
		CategoryID: &incomingCategory.ID,
		Amount:     req.Amount.Amount,
		Date:       time.Now(),
		Note:       fmt.Sprintf("Transfer from wallet: %s", fromWallet.WalletName),
	}

	// Create both transactions
	if err := s.txRepo.Create(ctx, outgoingTx); err != nil {
		return nil, apperrors.NewInternalErrorWithCause("failed to create outgoing transaction", err)
	}

	if err := s.txRepo.Create(ctx, incomingTx); err != nil {
		// Attempt to rollback by deleting the outgoing transaction
		_ = s.txRepo.Delete(ctx, outgoingTx.ID)
		return nil, apperrors.NewInternalErrorWithCause("failed to create incoming transaction", err)
	}

	// Withdraw from source
	_, err = s.walletRepo.UpdateBalance(ctx, req.FromWalletId, -req.Amount.Amount)
	if err != nil {
		// Attempt to rollback by refunding source and deleting transactions
		_, _ = s.walletRepo.UpdateBalance(ctx, req.FromWalletId, req.Amount.Amount)
		_ = s.txRepo.Delete(ctx, outgoingTx.ID)
		_ = s.txRepo.Delete(ctx, incomingTx.ID)
		return nil, err
	}

	// Add to destination
	_, err = s.walletRepo.UpdateBalance(ctx, req.ToWalletId, req.Amount.Amount)
	if err != nil {
		// Attempt to rollback by refunding source and deleting transactions
		_, _ = s.walletRepo.UpdateBalance(ctx, req.FromWalletId, req.Amount.Amount)
		_ = s.txRepo.Delete(ctx, outgoingTx.ID)
		_ = s.txRepo.Delete(ctx, incomingTx.ID)
		return nil, err
	}

	return &walletv1.TransferFundsResponse{
		Success:   true,
		Message:   "Funds transferred successfully",
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

func (s *walletService) GetTotalBalance(ctx context.Context, userID int32) (*walletv1.GetTotalBalanceResponse, error) {
	// Validate user ID
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Get total balance from repository
	totalBalance, err := s.walletRepo.GetTotalBalance(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Return response
	return &walletv1.GetTotalBalanceResponse{
		Success:   true,
		Message:   "Total balance retrieved successfully",
		Data:      &walletv1.Money{Amount: totalBalance, Currency: "VND"},
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// GetBalanceHistory retrieves balance history for chart visualization.
func (s *walletService) GetBalanceHistory(ctx context.Context, userID int32, req *walletv1.GetBalanceHistoryRequest) (*walletv1.GetBalanceHistoryResponse, error) {
	// Validate user ID
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Set default year to current year if not provided
	year := req.Year
	if year == 0 {
		year = int32(time.Now().Year())
	}

	// Determine the time range based on request
	var startTime, endTime time.Time
	if req.Month > 0 && req.Month <= 12 {
		// Daily data for specific month
		startTime = time.Date(int(year), time.Month(req.Month), 1, 0, 0, 0, 0, time.UTC)
		endTime = startTime.AddDate(0, 1, 0)
	} else {
		// Monthly data for entire year
		startTime = time.Date(int(year), 1, 1, 0, 0, 0, 0, time.UTC)
		endTime = startTime.AddDate(1, 0, 0)
	}

	// Get wallet IDs to query
	var walletIDs []int32
	if req.WalletId > 0 {
		// Verify wallet belongs to user
		_, err := s.walletRepo.GetByIDForUser(ctx, req.WalletId, userID)
		if err != nil {
			return nil, err
		}
		walletIDs = []int32{req.WalletId}
	} else {
		// Get all user wallets
		wallets, _, err := s.walletRepo.ListByUserID(ctx, userID, repository.ListOptions{
			Limit: 1000, // No practical limit for this use case
		})
		if err != nil {
			return nil, err
		}
		for _, w := range wallets {
			walletIDs = append(walletIDs, w.ID)
		}
	}

	if len(walletIDs) == 0 {
		return &walletv1.GetBalanceHistoryResponse{
			Success:   true,
			Message:   "No wallets found",
			Data:      []*walletv1.BalanceDataPoint{},
			Timestamp: time.Now().Format(time.RFC3339),
		}, nil
	}

	// Get transactions for the period
	txFilter := repository.TransactionFilter{
		WalletIDs:  walletIDs,
		StartDate:  &startTime,
		EndDate:    &endTime,
	}

	transactions, _, err := s.txRepo.List(ctx, userID, txFilter, repository.ListOptions{
		Limit:   10000,
		OrderBy: "date",
		Order:   "asc",
	})
	if err != nil {
		return nil, apperrors.NewInternalErrorWithCause("failed to fetch transactions", err)
	}

	// Get initial balance before the period
	initialBalance := int64(0)
	for _, walletID := range walletIDs {
		wallet, err := s.walletRepo.GetByID(ctx, walletID)
		if err != nil {
			continue
		}

		// Calculate balance change during the period to find initial balance
		balanceChange := int64(0)
		for _, tx := range transactions {
			if tx.WalletID == walletID {
				if tx.Category != nil {
					if tx.Category.Type == walletv1.CategoryType_CATEGORY_TYPE_INCOME {
						balanceChange += tx.Amount
					} else if tx.Category.Type == walletv1.CategoryType_CATEGORY_TYPE_EXPENSE {
						balanceChange -= tx.Amount
					}
				}
			}
		}
		initialBalance += wallet.Balance - balanceChange
	}

	// Generate data points
	var dataPoints []*walletv1.BalanceDataPoint

	if req.Month > 0 && req.Month <= 12 {
		// Daily data for month
		daysInMonth := int(endTime.Sub(startTime).Hours() / 24)
		currentBalance := initialBalance

		for day := 0; day < daysInMonth; day++ {
			dayStart := startTime.AddDate(0, 0, day)
			dayEnd := dayStart.AddDate(0, 0, 1)

			dailyIncome := int64(0)
			dailyExpense := int64(0)

			for _, tx := range transactions {
				if (tx.Date.Equal(dayStart) || tx.Date.After(dayStart)) && tx.Date.Before(dayEnd) {
					if tx.Category != nil {
						if tx.Category.Type == walletv1.CategoryType_CATEGORY_TYPE_INCOME {
							dailyIncome += tx.Amount
							currentBalance += tx.Amount
						} else if tx.Category.Type == walletv1.CategoryType_CATEGORY_TYPE_EXPENSE {
							dailyExpense += tx.Amount
							currentBalance -= tx.Amount
						}
					}
				}
			}

			dataPoints = append(dataPoints, &walletv1.BalanceDataPoint{
				Timestamp: dayStart.Unix(),
				Label:     fmt.Sprintf("%d %d", day+1, req.Month),
				Balance:   currentBalance,
				Income:    dailyIncome,
				Expense:   dailyExpense,
			})
		}
	} else {
		// Monthly data for year
		monthNames := []string{"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}
		currentBalance := initialBalance

		for month := 1; month <= 12; month++ {
			monthStart := time.Date(int(year), time.Month(month), 1, 0, 0, 0, 0, time.UTC)
			monthEnd := monthStart.AddDate(0, 1, 0)

			monthlyIncome := int64(0)
			monthlyExpense := int64(0)

			for _, tx := range transactions {
				if (tx.Date.Equal(monthStart) || tx.Date.After(monthStart)) && tx.Date.Before(monthEnd) {
					if tx.Category != nil {
						if tx.Category.Type == walletv1.CategoryType_CATEGORY_TYPE_INCOME {
							monthlyIncome += tx.Amount
							currentBalance += tx.Amount
						} else if tx.Category.Type == walletv1.CategoryType_CATEGORY_TYPE_EXPENSE {
							monthlyExpense += tx.Amount
							currentBalance -= tx.Amount
						}
					}
				}
			}

			dataPoints = append(dataPoints, &walletv1.BalanceDataPoint{
				Timestamp: monthStart.Unix(),
				Label:     monthNames[month-1],
				Balance:   currentBalance,
				Income:    monthlyIncome,
				Expense:   monthlyExpense,
			})
		}
	}

	return &walletv1.GetBalanceHistoryResponse{
		Success:   true,
		Message:   "Balance history retrieved successfully",
		Data:      dataPoints,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}
