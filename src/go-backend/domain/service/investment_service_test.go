package service

import (
	"context"
	"testing"
	"time"

	"wealthjourney/domain/models"
	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/types"

	investmentv1 "wealthjourney/protobuf/v1"
	walletv1 "wealthjourney/protobuf/v1"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// Mock dependencies
type MockWalletRepository struct {
	mock.Mock
}

func (m *MockWalletRepository) GetByID(ctx context.Context, id int32) (*models.Wallet, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Wallet), args.Error(1)
}

func (m *MockWalletRepository) GetByIDForUser(ctx context.Context, walletID, userID int32) (*models.Wallet, error) {
	args := m.Called(ctx, walletID, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Wallet), args.Error(1)
}

func (m *MockWalletRepository) Create(ctx context.Context, wallet *models.Wallet) error {
	args := m.Called(ctx, wallet)
	return args.Error(0)
}

func (m *MockWalletRepository) Update(ctx context.Context, wallet *models.Wallet) error {
	args := m.Called(ctx, wallet)
	return args.Error(0)
}

func (m *MockWalletRepository) Delete(ctx context.Context, id int32) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockWalletRepository) ListByUserID(ctx context.Context, userID int32, opts ListOptions) ([]*models.Wallet, int, error) {
	args := m.Called(ctx, userID, opts)
	return args.Get(0).([]*models.Wallet), args.Get(1).(int), args.Error(2)
}

func (m *MockWalletRepository) UpdateBalance(ctx context.Context, walletID int32, delta int64) (*models.Wallet, error) {
	args := m.Called(ctx, walletID, delta)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Wallet), args.Error(1)
}

func (m *MockWalletRepository) GetTotalBalance(ctx context.Context, userID int32) (int64, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).(int64), args.Error(1)
}

type MockInvestmentRepository struct {
	mock.Mock
}

func (m *MockInvestmentRepository) Create(ctx context.Context, investment *models.Investment) error {
	args := m.Called(ctx, investment)
	return args.Error(0)
}

func (m *MockInvestmentRepository) GetByID(ctx context.Context, id int32) (*models.Investment, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Investment), args.Error(1)
}

func (m *MockInvestmentRepository) GetByIDForUser(ctx context.Context, investmentID, userID int32) (*models.Investment, error) {
	args := m.Called(ctx, investmentID, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Investment), args.Error(1)
}

func (m *MockInvestmentRepository) GetByWalletAndSymbol(ctx context.Context, walletID int32, symbol string) (*models.Investment, error) {
	args := m.Called(ctx, walletID, symbol)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Investment), args.Error(1)
}

func (m *MockInvestmentRepository) ListByUserID(ctx context.Context, userID int32, opts ListOptions) ([]*models.Investment, int, error) {
	args := m.Called(ctx, userID, opts)
	return args.Get(0).([]*models.Investment), args.Get(1).(int), args.Error(2)
}

func (m *MockInvestmentRepository) ListByWalletID(ctx context.Context, walletID int32, opts ListOptions, typeFilter investmentv1.InvestmentType) ([]*models.Investment, int, error) {
	args := m.Called(ctx, walletID, opts, typeFilter)
	return args.Get(0).([]*models.Investment), args.Get(1).(int), args.Error(2)
}

func (m *MockInvestmentRepository) Update(ctx context.Context, investment *models.Investment) error {
	args := m.Called(ctx, investment)
	return args.Error(0)
}

func (m *MockInvestmentRepository) Delete(ctx context.Context, id int32) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockInvestmentRepository) UpdatePrices(ctx context.Context, updates []PriceUpdate) error {
	args := m.Called(ctx, updates)
	return args.Error(0)
}

func (m *MockInvestmentRepository) GetPortfolioSummary(ctx context.Context, walletID int32) (*PortfolioSummary, error) {
	args := m.Called(ctx, walletID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*PortfolioSummary), args.Error(1)
}

type MockInvestmentTransactionRepository struct {
	mock.Mock
}

func (m *MockInvestmentTransactionRepository) Create(ctx context.Context, tx *models.InvestmentTransaction) error {
	args := m.Called(ctx, tx)
	return args.Error(0)
}

func (m *MockInvestmentTransactionRepository) GetByID(ctx context.Context, id int32) (*models.InvestmentTransaction, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.InvestmentTransaction), args.Error(1)
}

func (m *MockInvestmentTransactionRepository) GetByIDForUser(ctx context.Context, txID, userID int32) (*models.InvestmentTransaction, error) {
	args := m.Called(ctx, txID, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.InvestmentTransaction), args.Error(1)
}

func (m *MockInvestmentTransactionRepository) ListByInvestmentID(ctx context.Context, investmentID int32, typeFilter *investmentv1.InvestmentTransactionType, opts ListOptions) ([]*models.InvestmentTransaction, int, error) {
	args := m.Called(ctx, investmentID, typeFilter, opts)
	return args.Get(0).([]*models.InvestmentTransaction), args.Get(1).(int), args.Error(2)
}

func (m *MockInvestmentTransactionRepository) Update(ctx context.Context, tx *models.InvestmentTransaction) error {
	args := m.Called(ctx, tx)
	return args.Error(0)
}

func (m *MockInvestmentTransactionRepository) Delete(ctx context.Context, id int32) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockInvestmentTransactionRepository) GetOpenLots(ctx context.Context, investmentID int32) ([]*models.InvestmentLot, error) {
	args := m.Called(ctx, investmentID)
	return args.Get(0).([]*models.InvestmentLot), args.Error(1)
}

func (m *MockInvestmentTransactionRepository) CreateLot(ctx context.Context, lot *models.InvestmentLot) error {
	args := m.Called(ctx, lot)
	return args.Error(0)
}

func (m *MockInvestmentTransactionRepository) UpdateLot(ctx context.Context, lot *models.InvestmentLot) error {
	args := m.Called(ctx, lot)
	return args.Error(0)
}

func (m *MockInvestmentTransactionRepository) GetLotByID(ctx context.Context, lotID int32) (*models.InvestmentLot, error) {
	args := m.Called(ctx, lotID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.InvestmentLot), args.Error(1)
}

func (m *MockInvestmentTransactionRepository) GetLotByIDForInvestment(ctx context.Context, lotID, investmentID int32) (*models.InvestmentLot, error) {
	args := m.Called(ctx, lotID, investmentID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.InvestmentLot), args.Error(1)
}

type MockMarketDataService struct {
	mock.Mock
}

func (m *MockMarketDataService) GetPrice(ctx context.Context, symbol, currency string, maxAge time.Duration) (*models.MarketData, error) {
	args := m.Called(ctx, symbol, currency, maxAge)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.MarketData), args.Error(1)
}

func (m *MockMarketDataService) UpdatePricesForInvestments(ctx context.Context, investments []*models.Investment, forceRefresh bool) (map[int32]int64, error) {
	args := m.Called(ctx, investments, forceRefresh)
	return args.Get(0).(map[int32]int64), args.Error(1)
}

// Test helper functions
func createTestWallet(id int32, userID int32, walletType walletv1.WalletType) *models.Wallet {
	return &models.Wallet{
		ID:       id,
		UserID:   userID,
		WalletName: "Test Investment Wallet",
		Type:     walletType,
		Currency: "USD",
		Balance:  0,
	}
}

func createTestInvestment(id int32, walletID int32, symbol string, quantity, averageCost, totalCost int64) *models.Investment {
	return &models.Investment{
		ID:          id,
		WalletID:    walletID,
		Symbol:      symbol,
		Name:        symbol + " Inc.",
		Type:        investmentv1.InvestmentType_INVESTMENT_TYPE_STOCK,
		Quantity:    quantity,
		AverageCost: averageCost,
		TotalCost:   totalCost,
		Currency:    "USD",
	}
}

// Test CreateInvestment
func TestInvestmentService_CreateInvestment_Success(t *testing.T) {
	// Setup
	mockWalletRepo := new(MockWalletRepository)
	mockInvestmentRepo := new(MockInvestmentRepository)
	mockTxRepo := new(MockInvestmentTransactionRepository)
	mockMarketDataService := new(MockMarketDataService)

	service := NewInvestmentService(mockInvestmentRepo, mockWalletRepo, mockTxRepo, mockMarketDataService).(*investmentService)

	ctx := context.Background()
	userID := int32(1)
	walletID := int32(1)
	wallet := createTestWallet(walletID, userID, walletv1.WalletType_WALLET_TYPE_INVESTMENT)

	req := &investmentv1.CreateInvestmentRequest{
		WalletId: walletID,
		Symbol:   "AAPL",
		Name:     "Apple Inc.",
		Type:     investmentv1.InvestmentType_INVESTMENT_TYPE_STOCK,
		Quantity: 10000, // 1 share (4 decimal places)
		Price:    1500000, // $150.00
		Currency: "USD",
	}

	mockWalletRepo.On("GetByIDForUser", ctx, walletID, userID).Return(wallet, nil)
	mockInvestmentRepo.On("GetByWalletAndSymbol", ctx, walletID, "AAPL").Return(nil, nil)
	mockInvestmentRepo.On("Create", ctx, mock.AnythingOfType("*models.Investment")).Return(nil)

	// Execute
	response, err := service.CreateInvestment(ctx, userID, req)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.True(t, response.Success)
	assert.Equal(t, "Investment created successfully", response.Message)
	assert.NotNil(t, response.Data)

	mockWalletRepo.AssertExpectations(t)
	mockInvestmentRepo.AssertExpectations(t)
}

func TestInvestmentService_CreateInvestment_WalletNotFound(t *testing.T) {
	// Setup
	mockWalletRepo := new(MockWalletRepository)
	mockInvestmentRepo := new(MockInvestmentRepository)
	mockTxRepo := new(MockInvestmentTransactionRepository)
	mockMarketDataService := new(MockMarketDataService)

	service := NewInvestmentService(mockInvestmentRepo, mockWalletRepo, mockTxRepo, mockMarketDataService).(*investmentService)

	ctx := context.Background()
	userID := int32(1)
	walletID := int32(999)

	req := &investmentv1.CreateInvestmentRequest{
		WalletId: walletID,
		Symbol:   "AAPL",
		Name:     "Apple Inc.",
		Type:     investmentv1.InvestmentType_INVESTMENT_TYPE_STOCK,
		Quantity: 10000,
		Price:    1500000,
		Currency: "USD",
	}

	mockWalletRepo.On("GetByIDForUser", ctx, walletID, userID).Return(nil, apperrors.NewNotFoundError("wallet"))

	// Execute
	response, err := service.CreateInvestment(ctx, userID, req)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, response)
	assert.IsType(t, (*apperrors.NotFoundError)(nil), err)

	mockWalletRepo.AssertExpectations(t)
}

func TestInvestmentService_CreateInvestment_WrongWalletType(t *testing.T) {
	// Setup
	mockWalletRepo := new(MockWalletRepository)
	mockInvestmentRepo := new(MockInvestmentRepository)
	mockTxRepo := new(MockInvestmentTransactionRepository)
	mockMarketDataService := new(MockMarketDataService)

	service := NewInvestmentService(mockInvestmentRepo, mockWalletRepo, mockTxRepo, mockMarketDataService).(*investmentService)

	ctx := context.Background()
	userID := int32(1)
	walletID := int32(1)
	wallet := createTestWallet(walletID, userID, walletv1.WalletType_WALLET_TYPE_BASIC) // Wrong type

	req := &investmentv1.CreateInvestmentRequest{
		WalletId: walletID,
		Symbol:   "AAPL",
		Name:     "Apple Inc.",
		Type:     investmentv1.InvestmentType_INVESTMENT_TYPE_STOCK,
		Quantity: 10000,
		Price:    1500000,
		Currency: "USD",
	}

	mockWalletRepo.On("GetByIDForUser", ctx, walletID, userID).Return(wallet, nil)

	// Execute
	response, err := service.CreateInvestment(ctx, userID, req)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, response)
	assert.IsType(t, (*apperrors.ValidationError)(nil), err)
	assert.Contains(t, err.Error(), "investment wallet")

	mockWalletRepo.AssertExpectations(t)
}

func TestInvestmentService_CreateInvestment_DuplicateSymbol(t *testing.T) {
	// Setup
	mockWalletRepo := new(MockWalletRepository)
	mockInvestmentRepo := new(MockInvestmentRepository)
	mockTxRepo := new(MockInvestmentTransactionRepository)
	mockMarketDataService := new(MockMarketDataService)

	service := NewInvestmentService(mockInvestmentRepo, mockWalletRepo, mockTxRepo, mockMarketDataService).(*investmentService)

	ctx := context.Background()
	userID := int32(1)
	walletID := int32(1)
	wallet := createTestWallet(walletID, userID, walletv1.WalletType_WALLET_TYPE_INVESTMENT)
	existingInvestment := createTestInvestment(1, walletID, "AAPL", 10000, 1500000, 15000000000)

	req := &investmentv1.CreateInvestmentRequest{
		WalletId: walletID,
		Symbol:   "AAPL",
		Name:     "Apple Inc.",
		Type:     investmentv1.InvestmentType_INVESTMENT_TYPE_STOCK,
		Quantity: 10000,
		Price:    1500000,
		Currency: "USD",
	}

	mockWalletRepo.On("GetByIDForUser", ctx, walletID, userID).Return(wallet, nil)
	mockInvestmentRepo.On("GetByWalletAndSymbol", ctx, walletID, "AAPL").Return(existingInvestment, nil)

	// Execute
	response, err := service.CreateInvestment(ctx, userID, req)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, response)
	assert.IsType(t, (*apperrors.ConflictError)(nil), err)

	mockWalletRepo.AssertExpectations(t)
	mockInvestmentRepo.AssertExpectations(t)
}

// Test AddTransaction - Buy (creates lot)
func TestInvestmentService_AddTransaction_BuyCreatesLot(t *testing.T) {
	// Setup
	mockWalletRepo := new(MockWalletRepository)
	mockInvestmentRepo := new(MockInvestmentRepository)
	mockTxRepo := new(MockInvestmentTransactionRepository)
	mockMarketDataService := new(MockMarketDataService)

	service := NewInvestmentService(mockInvestmentRepo, mockWalletRepo, mockTxRepo, mockMarketDataService).(*investmentService)

	ctx := context.Background()
	userID := int32(1)
	walletID := int32(1)
	investmentID := int32(1)
	wallet := createTestWallet(walletID, userID, walletv1.WalletType_WALLET_TYPE_INVESTMENT)
	investment := createTestInvestment(investmentID, walletID, "AAPL", 0, 0, 0)

	req := &investmentv1.AddTransactionRequest{
		InvestmentId: investmentID,
		Type:         investmentv1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_BUY,
		Quantity:     10000, // 1 share
		Price:        1500000, // $150.00
		Fees:         100, // $1.00 fee
		TransactionDate: time.Now().Unix(),
		Notes:        "Initial buy",
	}

	mockWalletRepo.On("GetByIDForUser", ctx, walletID, userID).Return(wallet, nil)
	mockInvestmentRepo.On("GetByIDForUser", ctx, investmentID, userID).Return(investment, nil)
	mockTxRepo.On("GetOpenLots", ctx, investmentID).Return([]*models.InvestmentLot{}, nil)
	mockTxRepo.On("CreateLot", ctx, mock.AnythingOfType("*models.InvestmentLot")).Return(nil)
	mockTxRepo.On("Create", ctx, mock.AnythingOfType("*models.InvestmentTransaction")).Return(nil)
	mockInvestmentRepo.On("Update", ctx, mock.AnythingOfType("*models.Investment")).Return(nil)

	// Execute
	response, err := service.AddTransaction(ctx, userID, req)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.True(t, response.Success)

	mockWalletRepo.AssertExpectations(t)
	mockInvestmentRepo.AssertExpectations(t)
	mockTxRepo.AssertExpectations(t)
}

// Test AddTransaction - Sell (FIFO - consumes from oldest lot)
func TestInvestmentService_AddTransaction_SellConsumesOldestLot(t *testing.T) {
	// Setup
	mockWalletRepo := new(MockWalletRepository)
	mockInvestmentRepo := new(MockInvestmentRepository)
	mockTxRepo := new(MockInvestmentTransactionRepository)
	mockMarketDataService := new(MockMarketDataService)

	service := NewInvestmentService(mockInvestmentRepo, mockWalletRepo, mockTxRepo, mockMarketDataService).(*investmentService)

	ctx := context.Background()
	userID := int32(1)
	walletID := int32(1)
	investmentID := int32(1)
	wallet := createTestWallet(walletID, userID, walletv1.WalletType_WALLET_TYPE_INVESTMENT)
	investment := createTestInvestment(investmentID, walletID, "AAPL", 20000, 1500000, 30000000000)

	// Create two lots - oldest should be consumed first
	lot1 := &models.InvestmentLot{
		ID:                1,
		InvestmentID:      investmentID,
		Quantity:          10000,
		RemainingQuantity: 10000,
		AverageCost:       1500000,
		TotalCost:         15000000000,
		PurchasedAt:       time.Now().Add(-24 * time.Hour),
	}
	lot2 := &models.InvestmentLot{
		ID:                2,
		InvestmentID:      investmentID,
		Quantity:          10000,
		RemainingQuantity: 10000,
		AverageCost:       1600000,
		TotalCost:         16000000000,
		PurchasedAt:       time.Now(),
	}

	req := &investmentv1.AddTransactionRequest{
		InvestmentId: investmentID,
		Type:         investmentv1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_SELL,
		Quantity:     7000, // Sell 0.7 shares
		Price:        1700000, // $170.00
		Fees:         100,
		TransactionDate: time.Now().Unix(),
		Notes:        "Take profit",
	}

	mockWalletRepo.On("GetByIDForUser", ctx, walletID, userID).Return(wallet, nil)
	mockInvestmentRepo.On("GetByIDForUser", ctx, investmentID, userID).Return(investment, nil)
	mockTxRepo.On("GetOpenLots", ctx, investmentID).Return([]*models.InvestmentLot{lot1, lot2}, nil)
	mockTxRepo.On("UpdateLot", ctx, mock.MatchedBy(func(lot *models.InvestmentLot) bool {
		return lot.ID == 1 && lot.RemainingQuantity == 3000 // 10000 - 7000
	})).Return(nil)
	mockTxRepo.On("Create", ctx, mock.AnythingOfType("*models.InvestmentTransaction")).Return(nil)
	mockInvestmentRepo.On("Update", ctx, mock.MatchedBy(func(inv *models.Investment) bool {
		return inv.Quantity == 13000 && // 20000 - 7000
		 inv.RealizedPNL > 0 // Should have realized PNL
	})).Return(nil)

	// Execute
	response, err := service.AddTransaction(ctx, userID, req)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.True(t, response.Success)

	mockWalletRepo.AssertExpectations(t)
	mockInvestmentRepo.AssertExpectations(t)
	mockTxRepo.AssertExpectations(t)
}

// Test AddTransaction - Sell (partial lot consumption)
func TestInvestmentService_AddTransaction_SellConsumesMultipleLots(t *testing.T) {
	// Setup
	mockWalletRepo := new(MockWalletRepository)
	mockInvestmentRepo := new(MockInvestmentRepository)
	mockTxRepo := new(MockInvestmentTransactionRepository)
	mockMarketDataService := new(MockMarketDataService)

	service := NewInvestmentService(mockInvestmentRepo, mockWalletRepo, mockTxRepo, mockMarketDataService).(*investmentService)

	ctx := context.Background()
	userID := int32(1)
	walletID := int32(1)
	investmentID := int32(1)
	wallet := createTestWallet(walletID, userID, walletv1.WalletType_WALLET_TYPE_INVESTMENT)
	investment := createTestInvestment(investmentID, walletID, "AAPL", 20000, 1500000, 30000000000)

	// Create two lots with small quantities
	lot1 := &models.InvestmentLot{
		ID:                1,
		InvestmentID:      investmentID,
		Quantity:          3000,
		RemainingQuantity: 3000,
		AverageCost:       1500000,
		TotalCost:         4500000000,
		PurchasedAt:       time.Now().Add(-24 * time.Hour),
	}
	lot2 := &models.InvestmentLot{
		ID:                2,
		InvestmentID:      investmentID,
		Quantity:          10000,
		RemainingQuantity: 10000,
		AverageCost:       1600000,
		TotalCost:         16000000000,
		PurchasedAt:       time.Now(),
	}

	req := &investmentv1.AddTransactionRequest{
		InvestmentId: investmentID,
		Type:         investmentv1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_SELL,
		Quantity:     5000, // Should consume all of lot1 (3000) and 2000 from lot2
		Price:        1700000,
		Fees:         100,
		TransactionDate: time.Now().Unix(),
		Notes:        "Take profit",
	}

	mockWalletRepo.On("GetByIDForUser", ctx, walletID, userID).Return(wallet, nil)
	mockInvestmentRepo.On("GetByIDForUser", ctx, investmentID, userID).Return(investment, nil)
	mockTxRepo.On("GetOpenLots", ctx, investmentID).Return([]*models.InvestmentLot{lot1, lot2}, nil)
	// Both lots should be updated
	mockTxRepo.On("UpdateLot", ctx, mock.AnythingOfType("*models.InvestmentLot")).Return(nil).Times(2)
	mockTxRepo.On("Create", ctx, mock.AnythingOfType("*models.InvestmentTransaction")).Return(nil)
	mockInvestmentRepo.On("Update", ctx, mock.AnythingOfType("*models.Investment")).Return(nil)

	// Execute
	response, err := service.AddTransaction(ctx, userID, req)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.True(t, response.Success)

	mockWalletRepo.AssertExpectations(t)
	mockInvestmentRepo.AssertExpectations(t)
	mockTxRepo.AssertExpectations(t)
}

// Test AddTransaction - Cannot sell more than owned
func TestInvestmentService_AddTransaction_SellExceedsQuantity(t *testing.T) {
	// Setup
	mockWalletRepo := new(MockWalletRepository)
	mockInvestmentRepo := new(MockInvestmentRepository)
	mockTxRepo := new(MockInvestmentTransactionRepository)
	mockMarketDataService := new(MockMarketDataService)

	service := NewInvestmentService(mockInvestmentRepo, mockWalletRepo, mockTxRepo, mockMarketDataService).(*investmentService)

	ctx := context.Background()
	userID := int32(1)
	walletID := int32(1)
	investmentID := int32(1)
	wallet := createTestWallet(walletID, userID, walletv1.WalletType_WALLET_TYPE_INVESTMENT)
	investment := createTestInvestment(investmentID, walletID, "AAPL", 5000, 1500000, 7500000000)

	req := &investmentv1.AddTransactionRequest{
		InvestmentId: investmentID,
		Type:         investmentv1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_SELL,
		Quantity:     10000, // Trying to sell more than owned
		Price:        1700000,
		Fees:         100,
		TransactionDate: time.Now().Unix(),
		Notes:        "Excessive sell",
	}

	mockWalletRepo.On("GetByIDForUser", ctx, walletID, userID).Return(wallet, nil)
	mockInvestmentRepo.On("GetByIDForUser", ctx, investmentID, userID).Return(investment, nil)

	// Execute
	response, err := service.AddTransaction(ctx, userID, req)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, response)
	assert.IsType(t, (*apperrors.ValidationError)(nil), err)
	assert.Contains(t, err.Error(), "quantity")

	mockWalletRepo.AssertExpectations(t)
	mockInvestmentRepo.AssertExpectations(t)
}

// Test GetPortfolioSummary
func TestInvestmentService_GetPortfolioSummary_Success(t *testing.T) {
	// Setup
	mockWalletRepo := new(MockWalletRepository)
	mockInvestmentRepo := new(MockInvestmentRepository)
	mockTxRepo := new(MockInvestmentTransactionRepository)
	mockMarketDataService := new(MockMarketDataService)

	service := NewInvestmentService(mockInvestmentRepo, mockWalletRepo, mockTxRepo, mockMarketDataService).(*investmentService)

	ctx := context.Background()
	userID := int32(1)
	walletID := int32(1)
	wallet := createTestWallet(walletID, userID, walletv1.WalletType_WALLET_TYPE_INVESTMENT)

	summary := &PortfolioSummary{
		TotalValue:      100000000000, // $10,000
		TotalCost:       80000000000,  // $8,000
		TotalPNL:        20000000000,  // $2,000
		TotalPNLPercent: 25.0,
		RealizedPNL:     5000000000,   // $500
		UnrealizedPNL:   15000000000,  // $1,500
		TotalInvestments: 5,
		InvestmentsByType: map[investmentv1.InvestmentType]*TypeSummary{
			investmentv1.InvestmentType_INVESTMENT_TYPE_STOCK: {
				TotalValue: 70000000000,
				Count:      3,
			},
			investmentv1.InvestmentType_INVESTMENT_TYPE_CRYPTOCURRENCY: {
				TotalValue: 30000000000,
				Count:      2,
			},
		},
	}

	mockWalletRepo.On("GetByIDForUser", ctx, walletID, userID).Return(wallet, nil)
	mockInvestmentRepo.On("GetPortfolioSummary", ctx, walletID).Return(summary, nil)

	// Execute
	response, err := service.GetPortfolioSummary(ctx, walletID, userID)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.True(t, response.Success)
	assert.Equal(t, int64(100000000000), response.Data.TotalValue)
	assert.Equal(t, int64(20000000000), response.Data.TotalPnl)
	assert.Equal(t, int32(5), response.Data.TotalInvestments)
	assert.Len(t, response.Data.InvestmentsByType, 2)

	mockWalletRepo.AssertExpectations(t)
	mockInvestmentRepo.AssertExpectations(t)
}

// Test UpdatePrices
func TestInvestmentService_UpdatePrices_Success(t *testing.T) {
	// Setup
	mockWalletRepo := new(MockWalletRepository)
	mockInvestmentRepo := new(MockInvestmentRepository)
	mockTxRepo := new(MockInvestmentTransactionRepository)
	mockMarketDataService := new(MockMarketDataService)

	service := NewInvestmentService(mockInvestmentRepo, mockWalletRepo, mockTxRepo, mockMarketDataService).(*investmentService)

	ctx := context.Background()
	userID := int32(1)
	walletID := int32(1)
	wallet := createTestWallet(walletID, userID, walletv1.WalletType_WALLET_TYPE_INVESTMENT)
	investment1 := createTestInvestment(1, walletID, "AAPL", 10000, 1500000, 15000000000)
	investment2 := createTestInvestment(2, walletID, "BTC", 100000000, 50000000000, 5000000000000000)

	req := &investmentv1.UpdatePricesRequest{
		WalletId: walletID,
		ForceRefresh: false,
	}

	mockWalletRepo.On("GetByIDForUser", ctx, walletID, userID).Return(wallet, nil)
	mockInvestmentRepo.On("ListByWalletID", ctx, walletID, mock.Anything, investmentv1.InvestmentType_INVESTMENT_TYPE_UNSPECIFIED).Return([]*models.Investment{investment1, investment2}, 2, nil)
	mockMarketDataService.On("UpdatePricesForInvestments", ctx, mock.Anything, false).Return(map[int32]int64{
		1: 1600000, // AAPL @ $160
		2: 51000000000, // BTC @ $51,000
	}, nil)
	mockInvestmentRepo.On("UpdatePrices", ctx, mock.Anything).Return(nil)

	// Execute
	response, err := service.UpdatePrices(ctx, userID, req)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.True(t, response.Success)
	assert.Equal(t, int32(2), response.UpdatedCount)

	mockWalletRepo.AssertExpectations(t)
	mockInvestmentRepo.AssertExpectations(t)
	mockMarketDataService.AssertExpectations(t)
}
