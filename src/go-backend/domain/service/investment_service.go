package service

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"wealthjourney/domain/models"
	"wealthjourney/domain/repository"
	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/cache"
	"wealthjourney/pkg/types"
	"wealthjourney/pkg/units"
	"wealthjourney/pkg/validator"
	investmentv1 "wealthjourney/protobuf/v1"
	walletv1 "wealthjourney/protobuf/v1"
)

// investmentService implements InvestmentService.
type investmentService struct {
	investmentRepo    repository.InvestmentRepository
	walletRepo        repository.WalletRepository
	txRepo            repository.InvestmentTransactionRepository
	marketDataService MarketDataService
	userRepo          repository.UserRepository
	fxRateSvc         FXRateService
	currencyCache     *cache.CurrencyCache
	mapper            *InvestmentMapper
}

// NewInvestmentService creates a new InvestmentService.
func NewInvestmentService(
	investmentRepo repository.InvestmentRepository,
	walletRepo repository.WalletRepository,
	txRepo repository.InvestmentTransactionRepository,
	marketDataService MarketDataService,
	userRepo repository.UserRepository,
	fxRateSvc FXRateService,
	currencyCache *cache.CurrencyCache,
) InvestmentService {
	return &investmentService{
		investmentRepo:    investmentRepo,
		walletRepo:        walletRepo,
		txRepo:            txRepo,
		marketDataService: marketDataService,
		userRepo:          userRepo,
		fxRateSvc:         fxRateSvc,
		currencyCache:     currencyCache,
		mapper:            NewInvestmentMapper(),
	}
}

// CreateInvestment creates a new investment holding in a wallet.
func (s *investmentService) CreateInvestment(ctx context.Context, userID int32, req *investmentv1.CreateInvestmentRequest) (*investmentv1.CreateInvestmentResponse, error) {
	// 1. Validate inputs
	if err := validator.ID(userID); err != nil {
		return nil, err
	}
	if err := validator.ID(req.WalletId); err != nil {
		return nil, err
	}
	if req.Symbol == "" {
		return nil, apperrors.NewValidationError("symbol is required")
	}
	if req.Name == "" {
		return nil, apperrors.NewValidationError("name is required")
	}
	if req.InitialQuantity <= 0 {
		return nil, apperrors.NewValidationError("initialQuantity must be positive")
	}
	if req.InitialCost <= 0 {
		return nil, apperrors.NewValidationError("initialCost must be positive")
	}
	if err := validator.Currency(req.Currency); err != nil {
		return nil, err
	}

	// 2. Verify wallet exists and belongs to user
	wallet, err := s.walletRepo.GetByIDForUser(ctx, req.WalletId, userID)
	if err != nil {
		return nil, err
	}

	// 3. Validate wallet type - must be INVESTMENT
	if wallet.Type != walletv1.WalletType_INVESTMENT {
		return nil, apperrors.NewValidationError("investments can only be created in investment wallets")
	}

	// 4. Check for duplicate symbol in wallet
	existing, err := s.investmentRepo.GetByWalletAndSymbol(ctx, req.WalletId, req.Symbol)
	if err == nil && existing != nil {
		return nil, apperrors.NewConflictError(fmt.Sprintf("investment with symbol %s already exists in this wallet", req.Symbol))
	}

	// 5. Calculate initial average cost using utility function
	// Average cost is stored as "cents per whole unit" (e.g., cents per BTC, cents per share)
	var averageCost int64 = 0
	if req.InitialQuantity > 0 {
		averageCost = units.CalculateAverageCost(req.InitialCost, req.InitialQuantity, req.Type)
	}

	// 6. Create investment model
	investment := &models.Investment{
		WalletID:     req.WalletId,
		Symbol:       req.Symbol,
		Name:         req.Name,
		Type:         req.Type,
		Quantity:     req.InitialQuantity,
		AverageCost:  averageCost,
		TotalCost:    req.InitialCost,
		Currency:     req.Currency,
		CurrentPrice: averageCost, // Set to average cost initially
		RealizedPNL:  0,
	}

	// 7. Persist investment
	if err := s.investmentRepo.Create(ctx, investment); err != nil {
		return nil, err
	}

	// 8. Create initial buy transaction
	tx := &models.InvestmentTransaction{
		InvestmentID:    investment.ID,
		WalletID:        req.WalletId,
		Type:            investmentv1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_BUY,
		Quantity:        req.InitialQuantity,
		Price:           averageCost,
		Cost:            req.InitialCost,
		Fees:            0,
		TransactionDate: time.Now(),
		Notes:           "Initial investment",
	}

	if err := s.txRepo.Create(ctx, tx); err != nil {
		// Rollback investment creation
		_ = s.investmentRepo.Delete(ctx, investment.ID)
		return nil, apperrors.NewInternalErrorWithCause("failed to create investment transaction", err)
	}

	// 9. Create initial lot for FIFO tracking
	lot := &models.InvestmentLot{
		InvestmentID:      investment.ID,
		Quantity:          req.InitialQuantity,
		RemainingQuantity: req.InitialQuantity,
		AverageCost:       averageCost,
		TotalCost:         req.InitialCost,
		PurchasedAt:       time.Now(),
	}

	if err := s.txRepo.CreateLot(ctx, lot); err != nil {
		// Rollback
		_ = s.txRepo.Delete(ctx, tx.ID)
		_ = s.investmentRepo.Delete(ctx, investment.ID)
		return nil, apperrors.NewInternalErrorWithCause("failed to create investment lot", err)
	}

	// 10. Update transaction with lot ID
	tx.LotID = &lot.ID
	tx.RemainingQuantity = req.InitialQuantity
	if err := s.txRepo.Update(ctx, tx); err != nil {
		// Log error but don't fail - transaction is created
		fmt.Printf("Warning: failed to update transaction with lot ID: %v\n", err)
	}

	// Populate currency cache
	if err := s.populateInvestmentCache(ctx, userID, investment); err != nil {
		// Log error but don't fail - cache population is not critical
		fmt.Printf("Warning: failed to populate currency cache for investment %d: %v\n", investment.ID, err)
	}

	return &investmentv1.CreateInvestmentResponse{
		Success:   true,
		Message:   "Investment created successfully",
		Data:      s.mapper.ModelToProto(investment),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// GetInvestment retrieves an investment by ID, ensuring it belongs to the user.
func (s *investmentService) GetInvestment(ctx context.Context, investmentID int32, requestingUserID int32) (*investmentv1.GetInvestmentResponse, error) {
	if err := validator.ID(investmentID); err != nil {
		return nil, err
	}
	if err := validator.ID(requestingUserID); err != nil {
		return nil, err
	}

	investment, err := s.investmentRepo.GetByIDForUser(ctx, investmentID, requestingUserID)
	if err != nil {
		return nil, err
	}

	return &investmentv1.GetInvestmentResponse{
		Success:   true,
		Message:   "Investment retrieved successfully",
		Data:      s.mapper.ModelToProto(investment),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// ListInvestments retrieves all investments for a wallet with pagination and filtering.
func (s *investmentService) ListInvestments(ctx context.Context, userID int32, req *investmentv1.ListInvestmentsRequest) (*investmentv1.ListInvestmentsResponse, error) {
	if err := validator.ID(userID); err != nil {
		return nil, err
	}
	if err := validator.ID(req.WalletId); err != nil {
		return nil, err
	}

	// Verify wallet belongs to user
	wallet, err := s.walletRepo.GetByIDForUser(ctx, req.WalletId, userID)
	if err != nil {
		return nil, err
	}

	// Validate wallet type
	if wallet.Type != walletv1.WalletType_INVESTMENT {
		return nil, apperrors.NewValidationError("investments can only be listed in investment wallets")
	}

	// Parse pagination parameters from protobuf
	params := types.PaginationParams{
		Page:     int(req.Pagination.Page),
		PageSize: int(req.Pagination.PageSize),
		OrderBy:  req.Pagination.OrderBy,
		Order:    req.Pagination.Order,
	}
	params = params.Validate()

	opts := repository.ListOptions{
		Limit:   params.Limit(),
		Offset:  params.Offset(),
		OrderBy: params.OrderBy,
		Order:   params.Order,
	}

	// Get type filter
	typeFilter := investmentv1.InvestmentType_INVESTMENT_TYPE_UNSPECIFIED
	if req.TypeFilter != 0 {
		typeFilter = req.TypeFilter
	}

	// List investments
	investments, total, err := s.investmentRepo.ListByWalletID(ctx, req.WalletId, opts, typeFilter)
	if err != nil {
		return nil, err
	}

	protoInvestments := s.mapper.ModelSliceToProto(investments)
	paginationResult := types.NewPaginationResult(params.Page, params.PageSize, total)

	return &investmentv1.ListInvestmentsResponse{
		Success:    true,
		Message:    "Investments retrieved successfully",
		Data:       protoInvestments,
		Pagination: s.mapper.PaginationResultToProto(paginationResult),
		Timestamp:  time.Now().Format(time.RFC3339),
	}, nil
}

// UpdateInvestment updates an investment's details (manual price override).
func (s *investmentService) UpdateInvestment(ctx context.Context, investmentID int32, userID int32, req *investmentv1.UpdateInvestmentRequest) (*investmentv1.UpdateInvestmentResponse, error) {
	if err := validator.ID(investmentID); err != nil {
		return nil, err
	}
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Get investment and verify ownership
	investment, err := s.investmentRepo.GetByIDForUser(ctx, investmentID, userID)
	if err != nil {
		return nil, err
	}

	// Update allowed fields
	if req.Name != "" {
		investment.Name = req.Name
	}

	// Manual price override
	if req.CurrentPrice > 0 {
		investment.CurrentPrice = req.CurrentPrice
	}

	// Update investment
	if err := s.investmentRepo.Update(ctx, investment); err != nil {
		return nil, err
	}

	// Invalidate and repopulate currency cache
	if err := s.invalidateInvestmentCache(ctx, userID, investmentID); err != nil {
		fmt.Printf("Warning: failed to invalidate currency cache for investment %d: %v\n", investmentID, err)
	}
	if err := s.populateInvestmentCache(ctx, userID, investment); err != nil {
		fmt.Printf("Warning: failed to populate currency cache for investment %d: %v\n", investment.ID, err)
	}

	return &investmentv1.UpdateInvestmentResponse{
		Success:   true,
		Message:   "Investment updated successfully",
		Data:      s.mapper.ModelToProto(investment),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// DeleteInvestment deletes an investment.
func (s *investmentService) DeleteInvestment(ctx context.Context, investmentID int32, userID int32) (*investmentv1.DeleteInvestmentResponse, error) {
	if err := validator.ID(investmentID); err != nil {
		return nil, err
	}
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Get investment and verify ownership
	investment, err := s.investmentRepo.GetByIDForUser(ctx, investmentID, userID)
	if err != nil {
		return nil, err
	}
	_ = investment // Used for ownership verification

	// Check if investment has quantity
	// Note: We can't access investment here after the check if we're not using it
	// Let's refactor
	inv, err := s.investmentRepo.GetByIDForUser(ctx, investmentID, userID)
	if err != nil {
		return nil, err
	}

	if inv.Quantity > 0 {
		return nil, apperrors.NewValidationError("cannot delete investment with non-zero quantity. Sell all holdings first.")
	}

	// Delete investment
	if err := s.investmentRepo.Delete(ctx, investmentID); err != nil {
		return nil, err
	}

	// Invalidate currency cache
	if err := s.invalidateInvestmentCache(ctx, userID, investmentID); err != nil {
		fmt.Printf("Warning: failed to invalidate currency cache for investment %d: %v\n", investmentID, err)
	}

	return &investmentv1.DeleteInvestmentResponse{
		Success:   true,
		Message:   "Investment deleted successfully",
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// AddTransaction adds a buy/sell transaction to an investment with FIFO cost basis tracking.
func (s *investmentService) AddTransaction(ctx context.Context, userID int32, req *investmentv1.AddTransactionRequest) (*investmentv1.AddTransactionResponse, error) {
	// 1. Validate inputs
	if err := validator.ID(req.InvestmentId); err != nil {
		return nil, err
	}
	if req.Quantity <= 0 {
		return nil, apperrors.NewValidationError("quantity must be positive")
	}
	if req.Price <= 0 {
		return nil, apperrors.NewValidationError("price must be positive")
	}
	if req.Type == investmentv1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_UNSPECIFIED {
		return nil, apperrors.NewValidationError("transaction type must be specified")
	}
	// Validate transaction date is not in the future
	transactionTime := time.Unix(req.TransactionDate, 0)
	if transactionTime.After(time.Now()) {
		return nil, apperrors.NewValidationError("transaction date cannot be in the future")
	}

	// 2. Get investment and verify ownership
	investment, err := s.investmentRepo.GetByIDForUser(ctx, req.InvestmentId, userID)
	if err != nil {
		return nil, err
	}

	// 3. Verify wallet ownership
	wallet, err := s.walletRepo.GetByIDForUser(ctx, investment.WalletID, userID)
	if err != nil {
		return nil, err
	}
	_ = wallet // Used for ownership verification

	if wallet.Type != walletv1.WalletType_INVESTMENT {
		return nil, apperrors.NewValidationError("transactions can only be added to investments in investment wallets")
	}

	// 4. Calculate transaction cost using utility function
	cost := units.CalculateTransactionCost(req.Quantity, req.Price, investment.Type)
	totalCost := cost + req.Fees

	// 5. Handle transaction type
	var updatedInvestment *models.Investment
	switch req.Type {
	case investmentv1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_BUY:
		updatedInvestment, err = s.processBuyTransaction(ctx, investment, req, cost, totalCost)
		if err != nil {
			return nil, err
		}

	case investmentv1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_SELL:
		updatedInvestment, err = s.processSellTransaction(ctx, investment, req)
		if err != nil {
			return nil, err
		}

	default:
		return nil, apperrors.NewValidationError("unsupported transaction type")
	}

	// Invalidate and repopulate currency cache
	if err := s.invalidateInvestmentCache(ctx, userID, req.InvestmentId); err != nil {
		fmt.Printf("Warning: failed to invalidate currency cache for investment %d: %v\n", req.InvestmentId, err)
	}
	// Get updated investment for cache population
	updatedInv, _ := s.investmentRepo.GetByID(ctx, req.InvestmentId)
	if updatedInv != nil {
		if err := s.populateInvestmentCache(ctx, userID, updatedInv); err != nil {
			fmt.Printf("Warning: failed to populate currency cache for investment %d: %v\n", updatedInv.ID, err)
		}
	}

	// Get the created transaction for response
	transactions, _, err := s.txRepo.ListByInvestmentID(ctx, investment.ID, nil, repository.ListOptions{
		Limit:   1,
		OrderBy: "created_at",
		Order:   "desc",
	})
	if err != nil || len(transactions) == 0 {
		return &investmentv1.AddTransactionResponse{
			Success:           true,
			Message:           "Transaction added successfully",
			UpdatedInvestment: s.mapper.ModelToProto(updatedInvestment),
			Timestamp:         time.Now().Format(time.RFC3339),
		}, nil
	}

	return &investmentv1.AddTransactionResponse{
		Success:           true,
		Message:           "Transaction added successfully",
		Data:              s.mapper.TransactionToProto(transactions[0]),
		UpdatedInvestment: s.mapper.ModelToProto(updatedInvestment),
		Timestamp:         time.Now().Format(time.RFC3339),
	}, nil
}

// processBuyTransaction handles a buy transaction with lot creation.
func (s *investmentService) processBuyTransaction(ctx context.Context, investment *models.Investment, req *investmentv1.AddTransactionRequest, cost, totalCost int64) (*models.Investment, error) {
	// Get open lots to see if we can update the most recent one
	openLots, err := s.txRepo.GetOpenLots(ctx, investment.ID)
	if err != nil {
		return nil, apperrors.NewInternalErrorWithCause("failed to get open lots", err)
	}

	var lot *models.InvestmentLot
	updateExistingLot := false

	// Check if there's a recent lot we can update (same day purchase)
	if len(openLots) > 0 {
		mostRecentLot := openLots[len(openLots)-1]
		timeSincePurchase := time.Since(mostRecentLot.PurchasedAt)
		// Update lot if purchased within 24 hours (same trading day)
		if timeSincePurchase < 24*time.Hour {
			lot = mostRecentLot
			updateExistingLot = true
		}
	}

	// Create new lot if no recent lot found
	if lot == nil {
		lot = &models.InvestmentLot{
			InvestmentID: investment.ID,
			Quantity:     req.Quantity,
			TotalCost:    totalCost,
			PurchasedAt:  time.Unix(req.TransactionDate, 0),
		}
		// Calculate average cost using utility function
		lot.AverageCost = units.CalculateAverageCost(totalCost, req.Quantity, investment.Type)
		lot.RemainingQuantity = req.Quantity
	} else {
		// Update existing lot
		lot.Quantity += req.Quantity
		lot.TotalCost += totalCost
		// Recalculate average cost using utility function
		lot.AverageCost = units.CalculateAverageCost(lot.TotalCost, lot.Quantity, investment.Type)
		lot.RemainingQuantity = lot.Quantity
	}

	// Persist lot
	var lotErr error
	if updateExistingLot {
		lotErr = s.txRepo.UpdateLot(ctx, lot)
	} else {
		lotErr = s.txRepo.CreateLot(ctx, lot)
	}
	if lotErr != nil {
		return nil, apperrors.NewInternalErrorWithCause("failed to save investment lot", lotErr)
	}

	// Create transaction record
	tx := &models.InvestmentTransaction{
		InvestmentID:      investment.ID,
		WalletID:          investment.WalletID,
		Type:              investmentv1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_BUY,
		Quantity:          req.Quantity,
		Price:             req.Price,
		Cost:              cost,
		Fees:              req.Fees,
		TransactionDate:   time.Unix(req.TransactionDate, 0),
		Notes:             req.Notes,
		LotID:             &lot.ID,
		RemainingQuantity: lot.RemainingQuantity,
	}

	if err := s.txRepo.Create(ctx, tx); err != nil {
		return nil, apperrors.NewInternalErrorWithCause("failed to create transaction", err)
	}

	// Update investment
	investment.Quantity += req.Quantity
	investment.TotalCost += totalCost
	// Calculate average cost using utility function
	investment.AverageCost = units.CalculateAverageCost(investment.TotalCost, investment.Quantity, investment.Type)

	if err := s.investmentRepo.Update(ctx, investment); err != nil {
		return nil, apperrors.NewInternalErrorWithCause("failed to update investment", err)
	}

	return investment, nil
}

// processSellTransaction handles a sell transaction with FIFO lot consumption.
func (s *investmentService) processSellTransaction(ctx context.Context, investment *models.Investment, req *investmentv1.AddTransactionRequest) (*models.Investment, error) {
	// Validate sufficient quantity
	if investment.Quantity < req.Quantity {
		return nil, apperrors.NewValidationError(fmt.Sprintf("insufficient quantity: owned %d, trying to sell %d", investment.Quantity, req.Quantity))
	}

	// Get open lots (FIFO order by purchased_at ASC)
	openLots, err := s.txRepo.GetOpenLots(ctx, investment.ID)
	if err != nil {
		return nil, apperrors.NewInternalErrorWithCause("failed to get open lots", err)
	}

	if len(openLots) == 0 {
		return nil, apperrors.NewValidationError("no open lots available for selling")
	}

	// Calculate total available quantity
	totalAvailable := int64(0)
	for _, lot := range openLots {
		totalAvailable += lot.RemainingQuantity
	}

	if totalAvailable < req.Quantity {
		return nil, apperrors.NewValidationError(fmt.Sprintf("insufficient quantity in lots: available %d, trying to sell %d", totalAvailable, req.Quantity))
	}

	// FIFO: Consume from oldest lots first
	quantityToSell := req.Quantity
	realizedPNL := int64(0)
	sellPrice := req.Price

	for _, lot := range openLots {
		if quantityToSell <= 0 {
			break
		}

		if lot.RemainingQuantity == 0 {
			continue
		}

		// Calculate quantity to consume from this lot
		consumeFromLot := quantityToSell
		if consumeFromLot > lot.RemainingQuantity {
			consumeFromLot = lot.RemainingQuantity
		}

		// Calculate realized PNL for this lot using utility function
		// Convert consumeFromLot from smallest units to whole units
		precision := units.GetPrecisionForInvestmentType(investment.Type)
		consumeFromLotWholeUnits := float64(consumeFromLot) / float64(precision)
		lotCostBasis := float64(lot.AverageCost) * consumeFromLotWholeUnits
		lotSellValue := float64(sellPrice) * consumeFromLotWholeUnits
		lotPNL := units.CalculateRealizedPNL(int64(lotCostBasis), int64(lotSellValue))
		realizedPNL += lotPNL

		// Update lot
		lot.RemainingQuantity -= consumeFromLot
		if err := s.txRepo.UpdateLot(ctx, lot); err != nil {
			return nil, apperrors.NewInternalErrorWithCause("failed to update lot", err)
		}

		quantityToSell -= consumeFromLot
	}

	// Subtract fees from realized PNL
	realizedPNL -= req.Fees

	// Calculate total proceeds (sale value) for the transaction record
	// Cost for a sell transaction represents the total sale proceeds
	totalProceeds := units.CalculateTransactionCost(req.Quantity, req.Price, investment.Type)

	// Create transaction record
	tx := &models.InvestmentTransaction{
		InvestmentID:    investment.ID,
		WalletID:        investment.WalletID,
		Type:            investmentv1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_SELL,
		Quantity:        req.Quantity,
		Price:           req.Price,
		Cost:            totalProceeds,
		Fees:            req.Fees,
		TransactionDate: time.Unix(req.TransactionDate, time.Now().Unix()%int64(time.Second)),
		Notes:           req.Notes,
	}

	if len(openLots) > 0 {
		tx.LotID = &openLots[0].ID // Track the first lot consumed
	}

	if err := s.txRepo.Create(ctx, tx); err != nil {
		return nil, apperrors.NewInternalErrorWithCause("failed to create transaction", err)
	}

	// Update investment
	investment.Quantity -= req.Quantity
	investment.RealizedPNL += realizedPNL

	// CRITICAL: DO NOT recalculate TotalCost or AverageCost on sell
	// In FIFO cost basis accounting:
	// - TotalCost represents the cumulative cost of all purchases (cost basis)
	// - AverageCost is the weighted average of all buy transactions
	// - When selling, only Quantity decreases and RealizedPNL increases
	// - TotalCost and AverageCost MUST remain unchanged to maintain proper cost basis
	//
	// Example:
	//   Buy 100 shares @ $150: Quantity=100, TotalCost=$15,000, AvgCost=$150
	//   Sell 30 shares @ $170: Quantity=70, TotalCost=$15,000 (UNCHANGED), AvgCost=$150 (UNCHANGED)
	//   Realized PNL: 30 * ($170 - $150) = $600
	//
	// Edge case: If quantity reaches zero, we still preserve TotalCost and AverageCost
	// for historical tracking. They won't be used for PNL calculations when Quantity=0,
	// but they maintain accurate cost basis if more shares are purchased later.

	if err := s.investmentRepo.Update(ctx, investment); err != nil {
		return nil, apperrors.NewInternalErrorWithCause("failed to update investment", err)
	}

	return investment, nil
}

// ListTransactions retrieves transactions for an investment.
func (s *investmentService) ListTransactions(ctx context.Context, userID int32, req *investmentv1.ListInvestmentTransactionsRequest) (*investmentv1.ListInvestmentTransactionsResponse, error) {
	if err := validator.ID(req.InvestmentId); err != nil {
		return nil, err
	}
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Get investment and verify ownership
	investment, err := s.investmentRepo.GetByIDForUser(ctx, req.InvestmentId, userID)
	if err != nil {
		return nil, err
	}
	_ = investment // Used for ownership verification

	// Parse pagination parameters from protobuf
	params := types.PaginationParams{
		Page:     int(req.Pagination.Page),
		PageSize: int(req.Pagination.PageSize),
		OrderBy:  req.Pagination.OrderBy,
		Order:    req.Pagination.Order,
	}
	params = params.Validate()

	opts := repository.ListOptions{
		Limit:   params.Limit(),
		Offset:  params.Offset(),
		OrderBy: params.OrderBy,
		Order:   params.Order,
	}

	// Get type filter
	var typeFilter *investmentv1.InvestmentTransactionType
	if req.TypeFilter != 0 {
		typeFilter = &req.TypeFilter
	}

	// List transactions
	transactions, total, err := s.txRepo.ListByInvestmentID(ctx, req.InvestmentId, typeFilter, opts)
	if err != nil {
		return nil, err
	}

	protoTransactions := s.mapper.TransactionSliceToProto(transactions)
	paginationResult := types.NewPaginationResult(params.Page, params.PageSize, total)

	return &investmentv1.ListInvestmentTransactionsResponse{
		Success:    true,
		Message:    "Transactions retrieved successfully",
		Data:       protoTransactions,
		Pagination: s.mapper.PaginationResultToProto(paginationResult),
		Timestamp:  time.Now().Format(time.RFC3339),
	}, nil
}

// EditTransaction edits an existing transaction.
func (s *investmentService) EditTransaction(ctx context.Context, transactionID int32, userID int32, req *investmentv1.EditInvestmentTransactionRequest) (*investmentv1.EditInvestmentTransactionResponse, error) {
	if err := validator.ID(transactionID); err != nil {
		return nil, err
	}
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Get transaction and verify ownership
	tx, err := s.txRepo.GetByIDForUser(ctx, transactionID, userID)
	if err != nil {
		return nil, err
	}

	// Note: Editing transactions is complex with FIFO tracking
	// For now, we only allow editing notes
	if req.Notes != "" {
		tx.Notes = req.Notes
	}

	if err := s.txRepo.Update(ctx, tx); err != nil {
		return nil, err
	}

	return &investmentv1.EditInvestmentTransactionResponse{
		Success:   true,
		Message:   "Transaction updated successfully",
		Data:      s.mapper.TransactionToProto(tx),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// DeleteTransaction deletes a transaction.
func (s *investmentService) DeleteTransaction(ctx context.Context, transactionID int32, userID int32) (*investmentv1.DeleteInvestmentTransactionResponse, error) {
	if err := validator.ID(transactionID); err != nil {
		return nil, err
	}
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Get transaction and verify ownership
	tx, err := s.txRepo.GetByIDForUser(ctx, transactionID, userID)
	if err != nil {
		return nil, err
	}
	_ = tx // Used for ownership verification

	// Note: Deleting transactions is complex with FIFO tracking
	// For now, we only allow deleting recent transactions (within 24 hours)
	// This would require checking tx.CreatedAt

	// Delete transaction
	if err := s.txRepo.Delete(ctx, transactionID); err != nil {
		return nil, err
	}

	return &investmentv1.DeleteInvestmentTransactionResponse{
		Success:   true,
		Message:   "Transaction deleted successfully",
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// GetPortfolioSummary retrieves portfolio summary for a wallet.
func (s *investmentService) GetPortfolioSummary(ctx context.Context, walletID int32, userID int32) (*investmentv1.GetPortfolioSummaryResponse, error) {
	if err := validator.ID(walletID); err != nil {
		return nil, err
	}
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Verify wallet ownership
	wallet, err := s.walletRepo.GetByIDForUser(ctx, walletID, userID)
	if err != nil {
		return nil, err
	}
	_ = wallet // Used for ownership verification

	// Get investments for wallet to check if prices need refresh
	investments, _, err := s.investmentRepo.ListByWalletID(ctx, walletID, repository.ListOptions{
		Limit: 1000,
	}, investmentv1.InvestmentType_INVESTMENT_TYPE_UNSPECIFIED)
	if err != nil {
		return nil, err
	}

	// Check if prices need refresh (any investment updated > 15 min ago)
	needsRefresh := false
	for _, inv := range investments {
		if time.Since(inv.UpdatedAt) > 15*time.Minute {
			needsRefresh = true
			break
		}
	}

	// Auto-refresh if stale
	if needsRefresh {
		log.Printf("Auto-refreshing prices for wallet %d", walletID)
		_, err = s.UpdatePrices(ctx, userID, &investmentv1.UpdatePricesRequest{
			InvestmentIds: []int32{}, // Empty = update all
			ForceRefresh:  false,     // Use cache if fresh
		})
		if err != nil {
			log.Printf("Warning: failed to auto-refresh prices: %v", err)
			// Don't fail - continue with stale prices
		} else {
			// Re-fetch investments with updated prices
			investments, _, err = s.investmentRepo.ListByWalletID(ctx, walletID, repository.ListOptions{
				Limit: 1000,
			}, investmentv1.InvestmentType_INVESTMENT_TYPE_UNSPECIFIED)
			if err != nil {
				log.Printf("Warning: failed to re-fetch investments: %v", err)
			}
		}
	}

	// Get portfolio summary from repository
	summary, err := s.investmentRepo.GetPortfolioSummary(ctx, walletID)
	if err != nil {
		return nil, err
	}

	// Convert to protobuf format
	investmentsByType := make([]*investmentv1.InvestmentByType, 0, len(summary.InvestmentsByType))
	for invType, typeSummary := range summary.InvestmentsByType {
		investmentsByType = append(investmentsByType, &investmentv1.InvestmentByType{
			Type:       invType,
			TotalValue: typeSummary.TotalValue,
			Count:      typeSummary.Count,
		})
	}

	return &investmentv1.GetPortfolioSummaryResponse{
		Success: true,
		Message: "Portfolio summary retrieved successfully",
		Data: &investmentv1.PortfolioSummary{
			TotalValue:        summary.TotalValue,
			TotalCost:         summary.TotalCost,
			TotalPnl:          summary.TotalPNL,
			TotalPnlPercent:   summary.TotalPNLPercent,
			RealizedPnl:       summary.RealizedPNL,
			UnrealizedPnl:     summary.UnrealizedPNL,
			TotalInvestments:  summary.TotalInvestments,
			InvestmentsByType: investmentsByType,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// UpdatePrices updates current prices for investments.
func (s *investmentService) UpdatePrices(ctx context.Context, userID int32, req *investmentv1.UpdatePricesRequest) (*investmentv1.UpdatePricesResponse, error) {
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Get all investments for the user
	wallets, _, err := s.walletRepo.ListByUserID(ctx, userID, repository.ListOptions{
		Limit: 1000,
	})
	if err != nil {
		return nil, err
	}

	var allInvestments []*models.Investment
	for _, wallet := range wallets {
		if wallet.Type == walletv1.WalletType_INVESTMENT {
			investments, _, err := s.investmentRepo.ListByWalletID(ctx, wallet.ID, repository.ListOptions{
				Limit: 1000,
			}, investmentv1.InvestmentType_INVESTMENT_TYPE_UNSPECIFIED)
			if err != nil {
				continue
			}
			allInvestments = append(allInvestments, investments...)
		}
	}

	// Filter by investment IDs if specified
	var investmentsToUpdate []*models.Investment
	if len(req.InvestmentIds) > 0 {
		investmentIDMap := make(map[int32]bool)
		for _, id := range req.InvestmentIds {
			investmentIDMap[id] = true
		}
		for _, inv := range allInvestments {
			if investmentIDMap[inv.ID] {
				investmentsToUpdate = append(investmentsToUpdate, inv)
			}
		}
	} else {
		investmentsToUpdate = allInvestments
	}

	if len(investmentsToUpdate) == 0 {
		return &investmentv1.UpdatePricesResponse{
			Success:            true,
			Message:            "No investments to update",
			UpdatedInvestments: []*investmentv1.Investment{},
			Timestamp:          time.Now().Format(time.RFC3339),
		}, nil
	}

	// Update prices using market data service
	priceUpdates, err := s.marketDataService.UpdatePricesForInvestments(ctx, investmentsToUpdate, req.ForceRefresh)
	if err != nil {
		return nil, apperrors.NewInternalErrorWithCause("failed to update prices", err)
	}

	// Prepare updates for repository
	updates := make([]repository.PriceUpdate, 0, len(priceUpdates))
	for investmentID, price := range priceUpdates {
		updates = append(updates, repository.PriceUpdate{
			InvestmentID: investmentID,
			Price:        price,
			Timestamp:    time.Now().Unix(),
		})
	}

	// Batch update prices in repository
	if err := s.investmentRepo.UpdatePrices(ctx, updates); err != nil {
		return nil, apperrors.NewInternalErrorWithCause("failed to save price updates", err)
	}

	// Get updated investments for response - fetch from database to get recalculated values
	var updatedInvestments []*investmentv1.Investment
	for investmentID := range priceUpdates {
		// Fetch the updated investment from database to get recalculated current_value and PNL
		updatedInv, err := s.investmentRepo.GetByID(ctx, investmentID)
		if err != nil {
			log.Printf("Warning: failed to fetch updated investment %d: %v", investmentID, err)
			continue
		}
		updatedInvestments = append(updatedInvestments, s.mapper.ModelToProto(updatedInv))
	}

	return &investmentv1.UpdatePricesResponse{
		Success:            true,
		Message:            fmt.Sprintf("Updated prices for %d investments", len(priceUpdates)),
		UpdatedInvestments: updatedInvestments,
		Timestamp:          time.Now().Format(time.RFC3339),
	}, nil
}

// SearchSymbols searches for investment symbols by query using Yahoo Finance search API.
func (s *investmentService) SearchSymbols(ctx context.Context, query string, limit int) (*investmentv1.SearchSymbolsResponse, error) {
	// 1. Validate query
	if strings.TrimSpace(query) == "" {
		return nil, apperrors.NewValidationError("query is required")
	}

	// 2. Call Yahoo Finance search
	results, err := s.marketDataService.SearchSymbols(ctx, query, limit)
	if err != nil {
		return nil, err
	}

	// 3. Convert to protobuf format
	data := make([]*investmentv1.SearchResult, 0, len(results))
	for _, r := range results {
		data = append(data, &investmentv1.SearchResult{
			Symbol:   r.Symbol,
			Name:     r.Name,
			Type:     r.Type,
			Exchange: r.Exchange,
			ExchDisp: r.ExchDisp,
		})
	}

	// 4. Return response
	return &investmentv1.SearchSymbolsResponse{
		Success:   true,
		Message:   fmt.Sprintf("found %d symbols", len(data)),
		Data:      data,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// Currency conversion helper methods

// convertInvestmentValues converts investment values to the user's preferred currency
// Converts: TotalCost, CurrentValue, RealizedPNL
// Uses cache for fast lookups and populates cache on misses
func (s *investmentService) convertInvestmentValues(ctx context.Context, userID int32, investment *models.Investment) (totalCost, currentValue, realizedPNL int64, err error) {
	// Get user's preferred currency
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return 0, 0, 0, err
	}

	// If same currency, no conversion needed
	if investment.Currency == user.PreferredCurrency {
		return investment.TotalCost, investment.CurrentValue, investment.RealizedPNL, nil
	}

	// Cache miss - convert all values
	var convertedTotalCost, convertedCurrentValue, convertedRealizedPNL int64

	convertedTotalCost, err = s.fxRateSvc.ConvertAmount(ctx, investment.TotalCost, investment.Currency, user.PreferredCurrency)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("failed to convert total cost: %w", err)
	}

	convertedCurrentValue, err = s.fxRateSvc.ConvertAmount(ctx, investment.CurrentValue, investment.Currency, user.PreferredCurrency)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("failed to convert current value: %w", err)
	}

	convertedRealizedPNL, err = s.fxRateSvc.ConvertAmount(ctx, investment.RealizedPNL, investment.Currency, user.PreferredCurrency)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("failed to convert realized PNL: %w", err)
	}

	// Store total cost in cache (non-blocking, log errors only)
	go func() {
		if err := s.currencyCache.SetConvertedValue(context.Background(), userID, "investment", investment.ID, user.PreferredCurrency, convertedTotalCost); err != nil {
			fmt.Printf("Warning: failed to cache converted values for investment %d: %v\n", investment.ID, err)
		}
	}()

	return convertedTotalCost, convertedCurrentValue, convertedRealizedPNL, nil
}

// populateInvestmentCache populates the currency cache for an investment
// Called when investment is created or updated
func (s *investmentService) populateInvestmentCache(ctx context.Context, userID int32, investment *models.Investment) error {
	// Get user's preferred currency
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	// If same currency, no need to cache
	if investment.Currency == user.PreferredCurrency {
		return nil
	}

	// Convert and cache total cost
	convertedTotalCost, err := s.fxRateSvc.ConvertAmount(ctx, investment.TotalCost, investment.Currency, user.PreferredCurrency)
	if err != nil {
		return fmt.Errorf("failed to convert total cost for caching: %w", err)
	}

	return s.currencyCache.SetConvertedValue(ctx, userID, "investment", investment.ID, user.PreferredCurrency, convertedTotalCost)
}

// invalidateInvestmentCache removes cached conversions for an investment
// Called when investment is updated or deleted
func (s *investmentService) invalidateInvestmentCache(ctx context.Context, userID int32, investmentID int32) error {
	return s.currencyCache.DeleteEntityCache(ctx, userID, "investment", investmentID)
}
