package e2e

import (
	"context"
	"testing"
	"time"

	wealthjourney "wealthjourney/gen/go"
	"wealthjourney/src/go-backend/domain/models"
	"wealthjourney/src/go-backend/domain/repository"
	"wealthjourney/src/go-backend/domain/service"
	"wealthjourney/src/go-backend/pkg/database"
	"wealthjourney/src/go-backend/pkg/types"
)

// TestInvestmentFlow tests the complete investment workflow
func TestInvestmentFlow(t *testing.T) {
	// Setup database connection
	db, err := database.Connect()
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}

	// Create test user
	user := &models.User{
		Email:     "test-investment@example.com",
		FirstName: "Test",
		LastName:  "Investment",
	}

	if err := db.Create(user).Error; err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}
	defer db.Delete(user)

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	walletRepo := repository.NewWalletRepository(db)
	investmentRepo := repository.NewInvestmentRepository(db)
	transactionRepo := repository.NewInvestmentTransactionRepository(db)
	lotRepo := repository.NewInvestmentLotRepository(db)
	marketDataRepo := repository.NewMarketDataRepository(db)

	// Initialize services
	investmentService := service.NewInvestmentService(
		investmentRepo,
		transactionRepo,
		lotRepo,
		marketDataRepo,
		walletRepo,
		userRepo,
	)

	ctx := context.Background()

	t.Run("Create Investment Wallet", func(t *testing.T) {
		wallet := &models.Wallet{
			UserID:     user.ID,
			WalletName: "Investment Wallet",
			Balance:    100000000, // 100M VND
			Currency:   types.VND,
			Type:       wealthjourney.WalletType_WALLET_TYPE_INVESTMENT,
		}

		if err := walletRepo.Create(ctx, wallet); err != nil {
			t.Fatalf("Failed to create investment wallet: %v", err)
		}

		if wallet.ID == 0 {
			t.Error("Expected wallet ID to be set")
		}
	})

	t.Run("Create Investment", func(t *testing.T) {
		req := &wealthjourney.CreateInvestmentRequest{
			WalletId:      1, // Assuming wallet ID 1 exists
			Symbol:        "VCB",
			Name:          "Vietcombank",
			Type:          wealthjourney.InvestmentType_INVESTMENT_TYPE_STOCK,
			Exchange:      "HOSE",
			Currency:      "VND",
		}

		resp, err := investmentService.CreateInvestment(ctx, user.ID, req)
		if err != nil {
			t.Fatalf("Failed to create investment: %v", err)
		}

		if !resp.Success {
			t.Errorf("Expected success=true, got=%v", resp.Success)
		}

		if resp.Data.Symbol != "VCB" {
			t.Errorf("Expected symbol=VCB, got=%s", resp.Data.Symbol)
		}
	})

	t.Run("Add Buy Transaction", func(t *testing.T) {
		req := &wealthjourney.AddInvestmentTransactionRequest{
			InvestmentId: 1,
			Type:         wealthjourney.TransactionType_TRANSACTION_TYPE_BUY,
			Quantity:     100,
			Price: &wealthjourney.Money{
				Amount:   85000000,
				Currency: "VND",
			},
			TransactionDate: time.Now().Format(time.RFC3339),
			Note:            "Initial purchase",
		}

		resp, err := investmentService.AddTransaction(ctx, user.ID, req)
		if err != nil {
			t.Fatalf("Failed to add buy transaction: %v", err)
		}

		if !resp.Success {
			t.Errorf("Expected success=true, got=%v", resp.Success)
		}

		// Verify lot was created
		lots, err := lotRepo.ListByInvestmentID(ctx, 1)
		if err != nil {
			t.Fatalf("Failed to list lots: %v", err)
		}

		if len(lots) != 1 {
			t.Errorf("Expected 1 lot, got=%d", len(lots))
		}

		if lots[0].RemainingQuantity != 100 {
			t.Errorf("Expected remaining quantity=100, got=%d", lots[0].RemainingQuantity)
		}
	})

	t.Run("Add Sell Transaction - Partial Sale", func(t *testing.T) {
		// Update market price for PNL calculation
		marketData := &models.MarketData{
			Symbol:    "VCB",
			Price:     90000000,
			Currency:  "VND",
			Timestamp: time.Now(),
		}
		marketDataRepo.Create(ctx, marketData)

		req := &wealthjourney.AddInvestmentTransactionRequest{
			InvestmentId: 1,
			Type:         wealthjourney.TransactionType_TRANSACTION_TYPE_SELL,
			Quantity:     30, // Sell 30 shares
			Price: &wealthjourney.Money{
				Amount:   90000000,
				Currency: "VND",
			},
			TransactionDate: time.Now().Format(time.RFC3339),
			Note:            "Partial sale",
		}

		resp, err := investmentService.AddTransaction(ctx, user.ID, req)
		if err != nil {
			t.Fatalf("Failed to add sell transaction: %v", err)
		}

		if !resp.Success {
			t.Errorf("Expected success=true, got=%v", resp.Success)
		}

		// Verify lot was updated
		lots, err := lotRepo.ListByInvestmentID(ctx, 1)
		if err != nil {
			t.Fatalf("Failed to list lots: %v", err)
		}

		if len(lots) != 1 {
			t.Errorf("Expected 1 lot, got=%d", len(lots))
		}

		if lots[0].RemainingQuantity != 70 {
			t.Errorf("Expected remaining quantity=70, got=%d", lots[0].RemainingQuantity)
		}

		// Verify realized PNL calculation
		// Cost basis: 30 * 850,000 = 25,500,000
		// Proceeds: 30 * 900,000 = 27,000,000
		// Realized PNL: 27,000,000 - 25,500,000 = 1,500,000
		expectedPNL := int64(1500000)
		if resp.Data.RealizedPnl != expectedPNL {
			t.Errorf("Expected realized PNL=%d, got=%d", expectedPNL, resp.Data.RealizedPnl)
		}
	})

	t.Run("List Investments", func(t *testing.T) {
		resp, err := investmentService.ListInvestments(ctx, 1, types.PaginationParams{
			Page:     1,
			PageSize: 10,
		})

		if err != nil {
			t.Fatalf("Failed to list investments: %v", err)
		}

		if !resp.Success {
			t.Errorf("Expected success=true, got=%v", resp.Success)
		}

		if len(resp.Investments) == 0 {
			t.Error("Expected at least 1 investment")
		}
	})

	t.Run("Get Portfolio Summary", func(t *testing.T) {
		req := &wealthjourney.GetPortfolioSummaryRequest{
			WalletId: 1,
		}

		resp, err := investmentService.GetPortfolioSummary(ctx, user.ID, req)
		if err != nil {
			t.Fatalf("Failed to get portfolio summary: %v", err)
		}

		if !resp.Success {
			t.Errorf("Expected success=true, got=%v", resp.Success)
		}

		// Verify summary calculations
		if resp.Summary.TotalInvestments == 0 {
			t.Error("Expected total investments > 0")
		}

		// Total value: 70 shares * 900,000 = 63,000,000
		expectedTotalValue := int64(63000000)
		if resp.Summary.TotalValue != expectedTotalValue {
			t.Errorf("Expected total value=%d, got=%d", expectedTotalValue, resp.Summary.TotalValue)
		}

		// Cost basis: 100 * 850,000 - 30 * 850,000 = 70 * 850,000 = 59,500,000
		expectedCostBasis := int64(59500000)
		if resp.Summary.TotalCostBasis != expectedCostBasis {
			t.Errorf("Expected cost basis=%d, got=%d", expectedCostBasis, resp.Summary.TotalCostBasis)
		}

		// Unrealized PNL: 63,000,000 - 59,500,000 = 3,500,000
		expectedUnrealizedPNL := int64(3500000)
		if resp.Summary.UnrealizedPnl != expectedUnrealizedPNL {
			t.Errorf("Expected unrealized PNL=%d, got=%d", expectedUnrealizedPNL, resp.Summary.UnrealizedPnl)
		}

		// Realized PNL: 1,500,000 (from partial sale)
		expectedRealizedPNL := int64(1500000)
		if resp.Summary.TotalRealizedPnl != expectedRealizedPNL {
			t.Errorf("Expected realized PNL=%d, got=%d", expectedRealizedPNL, resp.Summary.TotalRealizedPnl)
		}
	})

	t.Run("Get Investment Transactions", func(t *testing.T) {
		resp, err := investmentService.GetInvestmentTransactions(ctx, 1, user.ID, types.PaginationParams{
			Page:     1,
			PageSize: 10,
		})

		if err != nil {
			t.Fatalf("Failed to get investment transactions: %v", err)
		}

		if !resp.Success {
			t.Errorf("Expected success=true, got=%v", resp.Success)
		}

		if len(resp.Transactions) < 2 {
			t.Errorf("Expected at least 2 transactions, got=%d", len(resp.Transactions))
		}
	})

	t.Run("Add Dividend Transaction", func(t *testing.T) {
		req := &wealthjourney.AddInvestmentTransactionRequest{
			InvestmentId: 1,
			Type:         wealthjourney.TransactionType_TRANSACTION_TYPE_DIVIDEND,
			Quantity:     0,
			Price: &wealthjourney.Money{
				Amount:   2000000,
				Currency: "VND",
			},
			TransactionDate: time.Now().Format(time.RFC3339),
			Note:            "Quarterly dividend",
		}

		resp, err := investmentService.AddTransaction(ctx, user.ID, req)
		if err != nil {
			t.Fatalf("Failed to add dividend transaction: %v", err)
		}

		if !resp.Success {
			t.Errorf("Expected success=true, got=%v", resp.Success)
		}

		// Verify dividend doesn't affect lots
		lots, err := lotRepo.ListByInvestmentID(ctx, 1)
		if err != nil {
			t.Fatalf("Failed to list lots: %v", err)
		}

		// Should still have 1 lot with 70 remaining shares
		if len(lots) != 1 || lots[0].RemainingQuantity != 70 {
			t.Error("Dividend should not affect lots")
		}
	})

	t.Run("Update Market Price", func(t *testing.T) {
		req := &wealthjourney.UpdateMarketPriceRequest{
			Symbol: "VCB",
			Price: &wealthjourney.Money{
				Amount:   95000000,
				Currency: "VND",
			},
		}

		resp, err := investmentService.UpdateMarketPrice(ctx, user.ID, req)
		if err != nil {
			t.Fatalf("Failed to update market price: %v", err)
		}

		if !resp.Success {
			t.Errorf("Expected success=true, got=%v", resp.Success)
		}

		// Verify market price was updated
		marketData, err := marketDataRepo.GetLatestPrice(ctx, "VCB")
		if err != nil {
			t.Fatalf("Failed to get latest price: %v", err)
		}

		if marketData.Price != 95000000 {
			t.Errorf("Expected price=95000000, got=%d", marketData.Price)
		}
	})
}
