// +build integration

package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"wealthjourney/domain/models"
	"wealthjourney/domain/repository"
	"wealthjourney/domain/service"
	"wealthjourney/pkg/config"
	"wealthjourney/pkg/database"
	v1 "wealthjourney/protobuf/v1"
)

// TestImportService_EndToEnd_CSV tests the complete import flow with a CSV file
func TestImportService_EndToEnd_CSV(t *testing.T) {
	// Setup
	cfg, err := config.Load()
	require.NoError(t, err)

	db, err := database.New(cfg)
	require.NoError(t, err)
	defer db.Close()

	ctx := context.Background()

	// Create repositories
	userRepo := repository.NewUserRepository(db)
	walletRepo := repository.NewWalletRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	transactionRepo := repository.NewTransactionRepository(db)
	importRepo := repository.NewImportRepository(db)
	merchantRepo := repository.NewMerchantRuleRepository(db)
	keywordRepo := repository.NewKeywordRepository(db)
	userMappingRepo := repository.NewUserMappingRepository(db)

	// Create FX service (mock for testing)
	fxService := &mockFXService{}

	// Create import service
	importService := service.NewImportService(
		db,
		importRepo,
		transactionRepo,
		walletRepo,
		categoryRepo,
		merchantRepo,
		keywordRepo,
		userMappingRepo,
		fxService,
		nil, // jobQueue
	)

	// Create test user
	user := &models.User{
		Email:    "test-import@example.com",
		Name:     "Test User",
		Provider: "google",
	}
	err = userRepo.Create(ctx, user)
	require.NoError(t, err)

	// Create test wallet
	wallet := &models.Wallet{
		UserID:     user.ID,
		WalletName: "Test Wallet",
		Balance:    10000000, // 100,000 VND
		Currency:   "VND",
		Status:     1,
		Type:       v1.WalletType_WALLET_TYPE_BASIC,
	}
	err = walletRepo.Create(ctx, wallet)
	require.NoError(t, err)

	// Create test category
	category := &models.Category{
		UserID: user.ID,
		Name:   "Food & Dining",
		Type:   int(v1.CategoryType_CATEGORY_TYPE_EXPENSE),
	}
	err = categoryRepo.Create(ctx, category)
	require.NoError(t, err)

	// Test transactions to import
	transactions := []*v1.ParsedTransaction{
		{
			RowNumber: 1,
			Date:      time.Now().AddDate(0, 0, -1).Unix(),
			Amount: &v1.Money{
				Amount:   -50000,
				Currency: "VND",
			},
			Description:         "Coffee Shop",
			Type:                v1.TransactionType_TRANSACTION_TYPE_EXPENSE,
			SuggestedCategoryId: category.ID,
			CategoryConfidence:  80,
			IsValid:             true,
		},
		{
			RowNumber: 2,
			Date:      time.Now().AddDate(0, 0, -2).Unix(),
			Amount: &v1.Money{
				Amount:   -100000,
				Currency: "VND",
			},
			Description:         "Grocery Store",
			Type:                v1.TransactionType_TRANSACTION_TYPE_EXPENSE,
			SuggestedCategoryId: category.ID,
			CategoryConfidence:  70,
			IsValid:             true,
		},
	}

	// Execute import
	importReq := &v1.ExecuteImportRequest{
		WalletId:            wallet.ID,
		FileId:              "test-file-id",
		Transactions:        transactions,
		Strategy:            v1.DuplicateHandlingStrategy_DUPLICATE_STRATEGY_IMPORT_ALL,
		ExcludedRowNumbers:  []int32{},
	}

	response, err := importService.ExecuteImport(ctx, user.ID, importReq)
	require.NoError(t, err)
	require.NotNil(t, response)
	assert.True(t, response.Success)
	assert.Equal(t, int32(2), response.Summary.TotalImported)
	assert.NotEmpty(t, response.ImportBatchId)

	// Verify transactions were created
	filter := repository.TransactionFilter{
		WalletID: &wallet.ID,
	}
	txList, count, err := transactionRepo.List(ctx, user.ID, filter, repository.ListOptions{
		Limit:   10,
		Offset:  0,
		OrderBy: "date",
		Order:   "desc",
	})
	require.NoError(t, err)
	assert.Equal(t, 2, count)
	assert.Len(t, txList, 2)

	// Verify wallet balance updated
	updatedWallet, err := walletRepo.GetByID(ctx, wallet.ID)
	require.NoError(t, err)
	expectedBalance := wallet.Balance - 150000 // 50k + 100k
	assert.Equal(t, expectedBalance, updatedWallet.Balance)

	// Test undo import
	undoResponse, err := importService.UndoImport(ctx, user.ID, response.ImportBatchId)
	require.NoError(t, err)
	assert.True(t, undoResponse.Success)

	// Verify transactions were deleted
	txListAfterUndo, countAfterUndo, err := transactionRepo.List(ctx, user.ID, filter, repository.ListOptions{
		Limit:   10,
		Offset:  0,
	})
	require.NoError(t, err)
	assert.Equal(t, 0, countAfterUndo)
	assert.Len(t, txListAfterUndo, 0)

	// Verify wallet balance restored
	restoredWallet, err := walletRepo.GetByID(ctx, wallet.ID)
	require.NoError(t, err)
	assert.Equal(t, wallet.Balance, restoredWallet.Balance)

	// Cleanup
	_ = walletRepo.Delete(ctx, wallet.ID)
	_ = categoryRepo.Delete(ctx, category.ID)
	_ = userRepo.Delete(ctx, user.ID)
}

// TestImportService_DuplicateDetection tests duplicate detection logic
func TestImportService_DuplicateDetection(t *testing.T) {
	// Setup
	cfg, err := config.Load()
	require.NoError(t, err)

	db, err := database.New(cfg)
	require.NoError(t, err)
	defer db.Close()

	ctx := context.Background()

	// Create repositories
	userRepo := repository.NewUserRepository(db)
	walletRepo := repository.NewWalletRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	transactionRepo := repository.NewTransactionRepository(db)
	importRepo := repository.NewImportRepository(db)
	merchantRepo := repository.NewMerchantRuleRepository(db)
	keywordRepo := repository.NewKeywordRepository(db)
	userMappingRepo := repository.NewUserMappingRepository(db)
	fxService := &mockFXService{}

	importService := service.NewImportService(
		db,
		importRepo,
		transactionRepo,
		walletRepo,
		categoryRepo,
		merchantRepo,
		keywordRepo,
		userMappingRepo,
		fxService,
		nil, // jobQueue
	)

	// Create test user and wallet
	user := &models.User{
		Email:    "test-duplicate@example.com",
		Name:     "Test User",
		Provider: "google",
	}
	err = userRepo.Create(ctx, user)
	require.NoError(t, err)

	wallet := &models.Wallet{
		UserID:     user.ID,
		WalletName: "Test Wallet",
		Balance:    1000000,
		Currency:   "VND",
		Status:     1,
		Type:       v1.WalletType_WALLET_TYPE_BASIC,
	}
	err = walletRepo.Create(ctx, wallet)
	require.NoError(t, err)

	// Create existing transaction
	txDate := time.Now().AddDate(0, 0, -1)
	existingTx := &models.Transaction{
		WalletID: wallet.ID,
		Amount:   -50000,
		Currency: "VND",
		Date:     txDate,
		Note:     "Coffee Shop",
	}
	err = transactionRepo.Create(ctx, existingTx)
	require.NoError(t, err)

	// Try to import duplicate transaction
	duplicateTx := &v1.ParsedTransaction{
		RowNumber: 1,
		Date:      txDate.Unix(),
		Amount: &v1.Money{
			Amount:   -50000,
			Currency: "VND",
		},
		Description: "Coffee Shop",
		Type:        v1.TransactionType_TRANSACTION_TYPE_EXPENSE,
		IsValid:     true,
	}

	// Detect duplicates
	detectReq := &v1.DetectDuplicatesRequest{
		WalletId:     wallet.ID,
		Transactions: []*v1.ParsedTransaction{duplicateTx},
	}

	detectResponse, err := importService.DetectDuplicates(ctx, user.ID, detectReq)
	require.NoError(t, err)
	require.NotNil(t, detectResponse)
	assert.True(t, detectResponse.Success)
	assert.Len(t, detectResponse.Matches, 1)
	assert.Greater(t, detectResponse.Matches[0].Confidence, float64(80))

	// Import with SKIP_ALL strategy
	importReq := &v1.ExecuteImportRequest{
		WalletId:     wallet.ID,
		FileId:       "test-file-id",
		Transactions: []*v1.ParsedTransaction{duplicateTx},
		Strategy:     v1.DuplicateHandlingStrategy_DUPLICATE_STRATEGY_SKIP_ALL,
	}

	importResponse, err := importService.ExecuteImport(ctx, user.ID, importReq)
	require.NoError(t, err)
	assert.Equal(t, int32(0), importResponse.Summary.TotalImported)
	assert.Equal(t, int32(1), importResponse.Summary.DuplicatesSkipped)

	// Cleanup
	_ = transactionRepo.Delete(ctx, existingTx.ID)
	_ = walletRepo.Delete(ctx, wallet.ID)
	_ = userRepo.Delete(ctx, user.ID)
}

// TestImportService_Performance_1000Transactions tests performance with 1000 transactions
func TestImportService_Performance_1000Transactions(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping performance test in short mode")
	}

	// Setup
	cfg, err := config.Load()
	require.NoError(t, err)

	db, err := database.New(cfg)
	require.NoError(t, err)
	defer db.Close()

	ctx := context.Background()

	// Create repositories
	userRepo := repository.NewUserRepository(db)
	walletRepo := repository.NewWalletRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	transactionRepo := repository.NewTransactionRepository(db)
	importRepo := repository.NewImportRepository(db)
	merchantRepo := repository.NewMerchantRuleRepository(db)
	keywordRepo := repository.NewKeywordRepository(db)
	userMappingRepo := repository.NewUserMappingRepository(db)
	fxService := &mockFXService{}

	importService := service.NewImportService(
		db,
		importRepo,
		transactionRepo,
		walletRepo,
		categoryRepo,
		merchantRepo,
		keywordRepo,
		userMappingRepo,
		fxService,
		nil, // jobQueue
	)

	// Create test user and wallet
	user := &models.User{
		Email:    "test-perf@example.com",
		Name:     "Test User",
		Provider: "google",
	}
	err = userRepo.Create(ctx, user)
	require.NoError(t, err)

	wallet := &models.Wallet{
		UserID:     user.ID,
		WalletName: "Performance Test Wallet",
		Balance:    1000000000, // 10M VND
		Currency:   "VND",
		Status:     1,
		Type:       v1.WalletType_WALLET_TYPE_BASIC,
	}
	err = walletRepo.Create(ctx, wallet)
	require.NoError(t, err)

	// Generate 1000 transactions
	transactions := make([]*v1.ParsedTransaction, 1000)
	for i := 0; i < 1000; i++ {
		transactions[i] = &v1.ParsedTransaction{
			RowNumber: int32(i + 1),
			Date:      time.Now().AddDate(0, 0, -i).Unix(),
			Amount: &v1.Money{
				Amount:   int64(-10000 - (i * 100)),
				Currency: "VND",
			},
			Description: "Transaction " + string(rune(i)),
			Type:        v1.TransactionType_TRANSACTION_TYPE_EXPENSE,
			IsValid:     true,
		}
	}

	// Execute import and measure time
	importReq := &v1.ExecuteImportRequest{
		WalletId:     wallet.ID,
		FileId:       "perf-test-file-id",
		Transactions: transactions,
		Strategy:     v1.DuplicateHandlingStrategy_DUPLICATE_STRATEGY_IMPORT_ALL,
	}

	startTime := time.Now()
	response, err := importService.ExecuteImport(ctx, user.ID, importReq)
	duration := time.Since(startTime)

	require.NoError(t, err)
	require.NotNil(t, response)
	assert.True(t, response.Success)
	assert.Equal(t, int32(1000), response.Summary.TotalImported)

	// Performance assertion: should complete in less than 15 seconds
	t.Logf("Import of 1000 transactions took: %v", duration)
	assert.Less(t, duration.Seconds(), float64(15), "Import should complete in less than 15 seconds")

	// Cleanup
	_ = importService.UndoImport(ctx, user.ID, response.ImportBatchId)
	_ = walletRepo.Delete(ctx, wallet.ID)
	_ = userRepo.Delete(ctx, user.ID)
}

// mockFXService is a simple mock for FX service
type mockFXService struct{}

func (m *mockFXService) GetHistoricalRate(ctx context.Context, fromCurrency, toCurrency string, date time.Time) (float64, error) {
	return 1.0, nil
}

func (m *mockFXService) GetLatestRate(ctx context.Context, fromCurrency, toCurrency string) (float64, error) {
	return 1.0, nil
}

func (m *mockFXService) Convert(ctx context.Context, amount int64, fromCurrency, toCurrency string, date time.Time) (int64, float64, error) {
	return amount, 1.0, nil
}
