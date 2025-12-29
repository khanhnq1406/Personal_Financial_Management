package service

import (
	"context"

	"wealthjourney/internal/models"
	"wealthjourney/internal/repository"
	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/types"
	"wealthjourney/pkg/validator"
)

// walletService implements WalletService.
type walletService struct {
	walletRepo repository.WalletRepository
	userRepo   repository.UserRepository
}

// NewWalletService creates a new WalletService.
func NewWalletService(walletRepo repository.WalletRepository, userRepo repository.UserRepository) WalletService {
	return &walletService{
		walletRepo: walletRepo,
		userRepo:   userRepo,
	}
}

// CreateWallet creates a new wallet for a user.
func (s *walletService) CreateWallet(ctx context.Context, userID int32, req CreateWalletRequest) (*WalletDTO, error) {
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
	if req.InitialBalance.Amount < 0 {
		return nil, apperrors.NewValidationError("initial balance cannot be negative")
	}

	// Create wallet model
	wallet := &models.Wallet{
		UserID:     userID,
		WalletName: req.WalletName,
		Balance:    req.InitialBalance.Amount,
		Currency:   req.InitialBalance.Currency,
	}

	if err := s.walletRepo.Create(ctx, wallet); err != nil {
		return nil, err
	}

	return s.toWalletDTO(wallet), nil
}

// GetWallet retrieves a wallet by ID, ensuring it belongs to the user.
func (s *walletService) GetWallet(ctx context.Context, walletID int32, requestingUserID int32) (*WalletDTO, error) {
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

	return s.toWalletDTO(wallet), nil
}

// ListWallets retrieves all wallets for a user with pagination.
func (s *walletService) ListWallets(ctx context.Context, userID int32, params types.PaginationParams) (*WalletListResult, error) {
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

	walletDTOs := make([]WalletDTO, len(wallets))
	for i, w := range wallets {
		walletDTOs[i] = *s.toWalletDTO(w)
	}

	return &WalletListResult{
		Wallets:    walletDTOs,
		Pagination: types.NewPaginationResult(params.Page, params.PageSize, total),
	}, nil
}

// UpdateWallet updates a wallet's name.
func (s *walletService) UpdateWallet(ctx context.Context, walletID int32, userID int32, req UpdateWalletRequest) (*WalletDTO, error) {
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

	return s.toWalletDTO(wallet), nil
}

// DeleteWallet deletes a wallet.
func (s *walletService) DeleteWallet(ctx context.Context, walletID int32, userID int32) error {
	if err := validator.ID(walletID); err != nil {
		return err
	}
	if err := validator.ID(userID); err != nil {
		return err
	}

	// Verify ownership
	_, err := s.walletRepo.GetByIDForUser(ctx, walletID, userID)
	if err != nil {
		return err
	}

	return s.walletRepo.Delete(ctx, walletID)
}

// AddFunds adds funds to a wallet.
func (s *walletService) AddFunds(ctx context.Context, walletID int32, userID int32, req AddFundsRequest) (*WalletDTO, error) {
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
	if req.Amount.Amount <= 0 {
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

	return s.toWalletDTO(updated), nil
}

// WithdrawFunds withdraws funds from a wallet.
func (s *walletService) WithdrawFunds(ctx context.Context, walletID int32, userID int32, req WithdrawFundsRequest) (*WalletDTO, error) {
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
	if req.Amount.Amount <= 0 {
		return nil, apperrors.NewValidationError("amount must be positive")
	}
	if req.Amount.Currency != wallet.Currency {
		return nil, apperrors.NewValidationError("currency mismatch")
	}

	// Check sufficient balance
	if wallet.Balance < req.Amount.Amount {
		return nil, apperrors.NewValidationError("insufficient balance")
	}

	// Update balance (negative delta for withdrawal)
	updated, err := s.walletRepo.UpdateBalance(ctx, walletID, -req.Amount.Amount)
	if err != nil {
		return nil, err
	}

	return s.toWalletDTO(updated), nil
}

// TransferFunds transfers funds between two wallets belonging to the same user.
func (s *walletService) TransferFunds(ctx context.Context, userID int32, req TransferFundsRequest) (*TransferResult, error) {
	if err := validator.ID(userID); err != nil {
		return nil, err
	}
	if req.FromWalletID == req.ToWalletID {
		return nil, apperrors.NewValidationError("source and destination wallets cannot be the same")
	}

	// Verify both wallets exist and belong to user
	fromWallet, err := s.walletRepo.GetByIDForUser(ctx, req.FromWalletID, userID)
	if err != nil {
		return nil, err
	}

	toWallet, err := s.walletRepo.GetByIDForUser(ctx, req.ToWalletID, userID)
	if err != nil {
		return nil, err
	}

	// Validate amount
	if req.Amount.Amount <= 0 {
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
		return nil, apperrors.NewValidationError("insufficient balance")
	}

	// Withdraw from source
	updatedFrom, err := s.walletRepo.UpdateBalance(ctx, req.FromWalletID, -req.Amount.Amount)
	if err != nil {
		return nil, err
	}

	// Add to destination
	updatedTo, err := s.walletRepo.UpdateBalance(ctx, req.ToWalletID, req.Amount.Amount)
	if err != nil {
		// Attempt to rollback by refunding source
		_, _ = s.walletRepo.UpdateBalance(ctx, req.FromWalletID, req.Amount.Amount)
		return nil, err
	}

	return &TransferResult{
		FromWallet: *s.toWalletDTO(updatedFrom),
		ToWallet:   *s.toWalletDTO(updatedTo),
		Amount:     req.Amount,
	}, nil
}

// toWalletDTO converts a Wallet model to a WalletDTO.
func (s *walletService) toWalletDTO(wallet *models.Wallet) *WalletDTO {
	return &WalletDTO{
		ID:         wallet.ID,
		UserID:     wallet.UserID,
		WalletName: wallet.WalletName,
		Balance: types.Money{
			Amount:   wallet.Balance,
			Currency: wallet.Currency,
		},
		CreatedAt: wallet.CreatedAt,
		UpdatedAt: wallet.UpdatedAt,
	}
}
