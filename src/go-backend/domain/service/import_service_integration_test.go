//go:build integration

package service

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"wealthjourney/domain/models"
	"wealthjourney/domain/repository"
	"wealthjourney/pkg/types"
	v1 "wealthjourney/protobuf/v1"
)

// TestImportService_ExecuteImport tests the complete import flow including wallet balance updates
func TestImportService_ExecuteImport(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	// Note: This test requires a properly configured test database
	// Run with: go test -tags=integration ./domain/service/...
	// Skip if test database is not available
	t.Skip("TODO: Configure test database to run this integration test")

	ctx := context.Background()

	// Setup test environment
	db, cleanup := setupTestDB(t)
	defer cleanup()

	// Setup repositories
	userRepo := setupUserRepository(db)
	walletRepo := setupWalletRepository(db)
	categoryRepo := setupCategoryRepository(db)
	transactionRepo := setupTransactionRepository(db)
	importRepo := setupImportRepository(db)
	merchantRepo := repository.NewMerchantRuleRepository(db)
	keywordRepo := repository.NewKeywordRepository(db)
	userMappingRepo := repository.NewUserMappingRepository(db)

	// Setup service
	importService := NewImportService(
		db,
		importRepo,
		transactionRepo,
		walletRepo,
		categoryRepo,
		merchantRepo,
		keywordRepo,
		userMappingRepo,
		nil, // fxService
		nil, // jobQueue
	)

	// Create test user
	user := &models.User{
		Email:             "import-test@example.com",
		Name:              "Import Test User",
		PreferredCurrency: types.VND,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}
	err := userRepo.Create(ctx, user)
	require.NoError(t, err, "Failed to create test user")

	// Create test wallet with initial balance
	initialBalance := int64(10000000) // 10M VND
	wallet := &models.Wallet{
		UserID:     user.ID,
		WalletName: "Test Import Wallet",
		Balance:    initialBalance,
		Currency:   types.VND,
		Type:       int32(v1.WalletType_BASIC),
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
	err = walletRepo.Create(ctx, wallet)
	require.NoError(t, err, "Failed to create test wallet")

	// Create test category
	category := &models.Category{
		UserID:    user.ID,
		Name:      "Test Category",
		Type:      int32(v1.CategoryType_CATEGORY_TYPE_EXPENSE),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	err = categoryRepo.Create(ctx, category)
	require.NoError(t, err, "Failed to create test category")

	t.Run("Import_Multiple_Transactions_Updates_Balance", func(t *testing.T) {
		// Prepare test transactions (2 income, 3 expense)
		now := time.Now()
		transactions := []*v1.ParsedTransaction{
			{
				RowNumber:   1,
				Date:        now.Unix(),
				Description: "Income 1",
				Amount: &v1.Money{
					Amount:   5000000, // +5M VND income
					Currency: types.VND,
				},
				IsValid:             true,
				SuggestedCategoryId: category.ID,
			},
			{
				RowNumber:   2,
				Date:        now.AddDate(0, 0, -1).Unix(),
				Description: "Income 2",
				Amount: &v1.Money{
					Amount:   3000000, // +3M VND income
					Currency: types.VND,
				},
				IsValid:             true,
				SuggestedCategoryId: category.ID,
			},
			{
				RowNumber:   3,
				Date:        now.AddDate(0, 0, -2).Unix(),
				Description: "Expense 1",
				Amount: &v1.Money{
					Amount:   -2000000, // -2M VND expense
					Currency: types.VND,
				},
				IsValid:             true,
				SuggestedCategoryId: category.ID,
			},
			{
				RowNumber:   4,
				Date:        now.AddDate(0, 0, -3).Unix(),
				Description: "Expense 2",
				Amount: &v1.Money{
					Amount:   -1000000, // -1M VND expense
					Currency: types.VND,
				},
				IsValid:             true,
				SuggestedCategoryId: category.ID,
			},
			{
				RowNumber:   5,
				Date:        now.AddDate(0, 0, -4).Unix(),
				Description: "Expense 3",
				Amount: &v1.Money{
					Amount:   -500000, // -0.5M VND expense
					Currency: types.VND,
				},
				IsValid:             true,
				SuggestedCategoryId: category.ID,
			},
		}

		// Execute import
		req := &v1.ExecuteImportRequest{
			FileId:       "test-file-123",
			WalletId:     wallet.ID,
			Transactions: transactions,
		}

		resp, err := importService.ExecuteImport(ctx, user.ID, req)
		require.NoError(t, err, "Failed to execute import")
		require.NotNil(t, resp)
		assert.True(t, resp.Success)
		assert.Equal(t, int32(5), resp.Summary.TotalImported)

		// Verify wallet balance updated correctly
		// Initial: 10M
		// Income: +5M +3M = +8M
		// Expense: -2M -1M -0.5M = -3.5M
		// Net change: +4.5M
		// Expected final: 14.5M
		expectedBalance := initialBalance + 4500000
		updatedWallet, err := walletRepo.GetByID(ctx, wallet.ID)
		require.NoError(t, err)
		assert.Equal(t, expectedBalance, updatedWallet.Balance, "Wallet balance should be updated correctly")

		// Verify summary calculations
		assert.Equal(t, int64(8000000), resp.Summary.TotalIncome.Amount, "Total income should be 8M")
		assert.Equal(t, int64(3500000), resp.Summary.TotalExpenses.Amount, "Total expenses should be 3.5M")
		assert.Equal(t, int64(4500000), resp.Summary.NetChange.Amount, "Net change should be +4.5M")
		assert.Equal(t, expectedBalance, resp.Summary.NewWalletBalance.Amount, "Response should show correct new balance")

		// Verify transactions were created
		// Note: This would require a method to list transactions by import batch
		// For now, we trust the BulkCreate worked if the balance is correct

		// Store import batch ID for undo test
		importBatchID := resp.ImportBatchId
		require.NotEmpty(t, importBatchID, "Import batch ID should be returned")

		t.Run("Undo_Import_Restores_Balance", func(t *testing.T) {
			// Undo the import
			undoResp, err := importService.UndoImport(ctx, user.ID, importBatchID)
			require.NoError(t, err, "Failed to undo import")
			require.NotNil(t, undoResp)
			assert.True(t, undoResp.Success)

			// Verify wallet balance restored to initial amount
			restoredWallet, err := walletRepo.GetByID(ctx, wallet.ID)
			require.NoError(t, err)
			assert.Equal(t, initialBalance, restoredWallet.Balance, "Wallet balance should be restored after undo")

			// Verify cannot undo again
			_, err = importService.UndoImport(ctx, user.ID, importBatchID)
			assert.Error(t, err, "Should not be able to undo twice")
			assert.Contains(t, err.Error(), "already been undone", "Error should indicate already undone")
		})
	})

	t.Run("Import_Excludes_Invalid_And_Excluded_Transactions", func(t *testing.T) {
		// Create new wallet for this test
		wallet2 := &models.Wallet{
			UserID:     user.ID,
			WalletName: "Test Wallet 2",
			Balance:    1000000, // 1M VND
			Currency:   types.VND,
			Type:       int32(v1.WalletType_BASIC),
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}
		err := walletRepo.Create(ctx, wallet2)
		require.NoError(t, err)

		now := time.Now()
		transactions := []*v1.ParsedTransaction{
			{
				RowNumber:   1,
				Date:        now.Unix(),
				Description: "Valid transaction",
				Amount: &v1.Money{
					Amount:   500000,
					Currency: types.VND,
				},
				IsValid:             true,
				SuggestedCategoryId: category.ID,
			},
			{
				RowNumber:   2,
				Date:        now.Unix(),
				Description: "Invalid transaction",
				Amount: &v1.Money{
					Amount:   200000,
					Currency: types.VND,
				},
				IsValid: false, // Should be skipped
			},
			{
				RowNumber:   3,
				Date:        now.Unix(),
				Description: "Excluded transaction",
				Amount: &v1.Money{
					Amount:   300000,
					Currency: types.VND,
				},
				IsValid:             true,
				SuggestedCategoryId: category.ID,
			},
		}

		req := &v1.ExecuteImportRequest{
			FileId:             "test-file-456",
			WalletId:           wallet2.ID,
			Transactions:       transactions,
			ExcludedRowNumbers: []int32{3}, // Exclude row 3
		}

		resp, err := importService.ExecuteImport(ctx, user.ID, req)
		require.NoError(t, err)
		assert.Equal(t, int32(1), resp.Summary.TotalImported, "Only 1 transaction should be imported")
		assert.Equal(t, int32(2), resp.Summary.TotalSkipped, "2 transactions should be skipped")

		// Verify balance updated only for valid transaction
		updatedWallet, err := walletRepo.GetByID(ctx, wallet2.ID)
		require.NoError(t, err)
		assert.Equal(t, int64(1500000), updatedWallet.Balance, "Balance should only include valid transaction")
	})

	t.Run("Import_Validates_Wallet_Ownership", func(t *testing.T) {
		// Create another user
		user2 := &models.User{
			Email:             "user2@example.com",
			Name:              "User 2",
			PreferredCurrency: types.VND,
			CreatedAt:         time.Now(),
			UpdatedAt:         time.Now(),
		}
		err := userRepo.Create(ctx, user2)
		require.NoError(t, err)

		// Try to import to wallet owned by user1 as user2
		req := &v1.ExecuteImportRequest{
			FileId:   "test-file-789",
			WalletId: wallet.ID, // Wallet belongs to user1
			Transactions: []*v1.ParsedTransaction{
				{
					RowNumber:   1,
					Date:        time.Now().Unix(),
					Description: "Test",
					Amount:      &v1.Money{Amount: 100000, Currency: types.VND},
					IsValid:     true,
				},
			},
		}

		_, err = importService.ExecuteImport(ctx, user2.ID, req)
		assert.Error(t, err, "Should return error for unauthorized wallet access")
	})
}

// TestImportService_DuplicateDetection tests duplicate transaction detection during import
func TestImportService_DuplicateDetection(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	t.Skip("TODO: Configure test database to run this integration test")

	// Test case 1: Import same transactions twice - should detect duplicates
	t.Run("Exact duplicate detection", func(t *testing.T) {
		// Create test wallet
		wallet := createTestWallet(t, testUserID, "Test Wallet")

		// Create first import batch
		batch1 := createTestImportBatch(t, testUserID, wallet.ID, "test1.csv")

		// Import transactions
		transactions := []models.Transaction{
			{
				UserID:      testUserID,
				WalletID:    wallet.ID,
				Amount:      50000000, // 5,000,000 VND
				Type:        v1.TransactionType_TRANSACTION_TYPE_EXPENSE,
				Description: "Test transaction",
				Date:        time.Now(),
				ExternalID:  "TXN001",
			},
		}

		// Import first time
		err := importRepo.CreateTransactions(context.Background(), batch1.ID, transactions)
		if err != nil {
			t.Fatalf("Failed to import transactions: %v", err)
		}

		// Create second import batch with same transactions
		batch2 := createTestImportBatch(t, testUserID, wallet.ID, "test2.csv")

		// Import again - should detect duplicates
		duplicates, err := importService.DetectDuplicates(context.Background(), testUserID, wallet.ID, transactions)
		if err != nil {
			t.Fatalf("Failed to detect duplicates: %v", err)
		}

		// Verify duplicate detected
		if len(duplicates) != 1 {
			t.Errorf("Expected 1 duplicate, got %d", len(duplicates))
		}

		if len(duplicates) > 0 {
			if duplicates[0].Confidence < 90 {
				t.Errorf("Expected high confidence (>=90), got %d", duplicates[0].Confidence)
			}
		}
	})

	// Test case 2: Fuzzy matching with similar amounts/dates
	t.Run("Fuzzy matching detection", func(t *testing.T) {
		wallet := createTestWallet(t, testUserID, "Test Wallet 2")
		batch := createTestImportBatch(t, testUserID, wallet.ID, "test3.csv")

		// Import transaction
		original := models.Transaction{
			UserID:      testUserID,
			WalletID:    wallet.ID,
			Amount:      100000000, // 10,000,000 VND
			Type:        v1.TransactionType_TRANSACTION_TYPE_EXPENSE,
			Description: "Restaurant ABC",
			Date:        time.Now(),
		}

		err := importRepo.CreateTransactions(context.Background(), batch.ID, []models.Transaction{original})
		if err != nil {
			t.Fatalf("Failed to import transaction: %v", err)
		}

		// Try to import similar transaction (slightly different amount)
		similar := models.Transaction{
			UserID:      testUserID,
			WalletID:    wallet.ID,
			Amount:      100500000, // 10,050,000 VND (0.5% difference)
			Type:        v1.TransactionType_TRANSACTION_TYPE_EXPENSE,
			Description: "Restaurant ABC",
			Date:        time.Now().Add(-1 * time.Hour), // 1 hour earlier
		}

		duplicates, err := importService.DetectDuplicates(context.Background(), testUserID, wallet.ID, []models.Transaction{similar})
		if err != nil {
			t.Fatalf("Failed to detect duplicates: %v", err)
		}

		// Should detect as potential duplicate with medium confidence
		if len(duplicates) != 1 {
			t.Errorf("Expected 1 potential duplicate, got %d", len(duplicates))
		}

		if len(duplicates) > 0 {
			if duplicates[0].Confidence < 50 || duplicates[0].Confidence > 90 {
				t.Errorf("Expected medium confidence (50-90), got %d", duplicates[0].Confidence)
			}
		}
	})

	// Test case 3: No false positives
	t.Run("No false positive detection", func(t *testing.T) {
		wallet := createTestWallet(t, testUserID, "Test Wallet 3")
		batch := createTestImportBatch(t, testUserID, wallet.ID, "test4.csv")

		// Import transaction
		original := models.Transaction{
			UserID:      testUserID,
			WalletID:    wallet.ID,
			Amount:      50000000,
			Type:        v1.TransactionType_TRANSACTION_TYPE_EXPENSE,
			Description: "Coffee Shop A",
			Date:        time.Now(),
		}

		err := importRepo.CreateTransactions(context.Background(), batch.ID, []models.Transaction{original})
		if err != nil {
			t.Fatalf("Failed to import transaction: %v", err)
		}

		// Try to import completely different transaction
		different := models.Transaction{
			UserID:      testUserID,
			WalletID:    wallet.ID,
			Amount:      150000000, // Very different amount
			Type:        v1.TransactionType_TRANSACTION_TYPE_EXPENSE,
			Description: "Supermarket XYZ", // Different description
			Date:        time.Now().Add(-48 * time.Hour), // 2 days ago
		}

		duplicates, err := importService.DetectDuplicates(context.Background(), testUserID, wallet.ID, []models.Transaction{different})
		if err != nil {
			t.Fatalf("Failed to detect duplicates: %v", err)
		}

		// Should not detect any duplicates
		if len(duplicates) > 0 {
			t.Errorf("Expected 0 duplicates (no false positives), got %d", len(duplicates))
		}
	})

	// Test case 4: Verify duplicate count in import summary
	t.Run("Import summary duplicate count", func(t *testing.T) {
		wallet := createTestWallet(t, testUserID, "Test Wallet 4")

		// First import
		batch1 := createTestImportBatch(t, testUserID, wallet.ID, "test5.csv")
		transactions := []models.Transaction{
			{
				UserID:      testUserID,
				WalletID:    wallet.ID,
				Amount:      25000000,
				Type:        v1.TransactionType_TRANSACTION_TYPE_EXPENSE,
				Description: "Payment 1",
				Date:        time.Now(),
				ExternalID:  "PAY001",
			},
			{
				UserID:      testUserID,
				WalletID:    wallet.ID,
				Amount:      35000000,
				Type:        v1.TransactionType_TRANSACTION_TYPE_EXPENSE,
				Description: "Payment 2",
				Date:        time.Now(),
				ExternalID:  "PAY002",
			},
		}

		err := importRepo.CreateTransactions(context.Background(), batch1.ID, transactions)
		if err != nil {
			t.Fatalf("Failed to import transactions: %v", err)
		}

		// Second import with 1 duplicate
		batch2 := createTestImportBatch(t, testUserID, wallet.ID, "test6.csv")
		mixedTransactions := []models.Transaction{
			transactions[0], // Duplicate
			{
				UserID:      testUserID,
				WalletID:    wallet.ID,
				Amount:      45000000,
				Type:        v1.TransactionType_TRANSACTION_TYPE_EXPENSE,
				Description: "Payment 3",
				Date:        time.Now(),
				ExternalID:  "PAY003",
			}, // New transaction
		}

		duplicates, err := importService.DetectDuplicates(context.Background(), testUserID, wallet.ID, mixedTransactions)
		if err != nil {
			t.Fatalf("Failed to detect duplicates: %v", err)
		}

		// Verify exactly 1 duplicate detected
		if len(duplicates) != 1 {
			t.Errorf("Expected 1 duplicate in summary, got %d", len(duplicates))
		}

		// Update batch statistics
		batch2.DuplicatesSkipped = int32(len(duplicates))
		err = importRepo.UpdateImportBatch(context.Background(), batch2)
		if err != nil {
			t.Fatalf("Failed to update batch: %v", err)
		}

		// Verify batch statistics
		updated, err := importRepo.GetImportBatchByID(context.Background(), batch2.ID)
		if err != nil {
			t.Fatalf("Failed to get batch: %v", err)
		}

		if updated.DuplicatesSkipped != 1 {
			t.Errorf("Expected DuplicatesSkipped=1, got %d", updated.DuplicatesSkipped)
		}
	})
}

// TestImportService_BulkInsertPerformance tests performance of bulk transaction creation
func TestImportService_BulkInsertPerformance(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	t.Skip("TODO: Configure test database to run this integration test")

	// Helper function to generate test transactions
	generateTestTransactions := func(count int, userID int32, walletID int32) []models.Transaction {
		transactions := make([]models.Transaction, count)
		baseDate := time.Now().Add(-30 * 24 * time.Hour) // 30 days ago

		for i := 0; i < count; i++ {
			transactions[i] = models.Transaction{
				UserID:      userID,
				WalletID:    walletID,
				Amount:      int64((i + 1) * 10000000), // Varying amounts
				Type:        v1.TransactionType_TRANSACTION_TYPE_EXPENSE,
				Description: fmt.Sprintf("Test transaction %d", i+1),
				Date:        baseDate.Add(time.Duration(i) * time.Hour),
				ExternalID:  fmt.Sprintf("TXN%05d", i+1),
			}
		}

		return transactions
	}

	// Test case 1: Import 100 transactions
	t.Run("Import 100 transactions", func(t *testing.T) {
		wallet := createTestWallet(t, testUserID, "Perf Test Wallet 100")
		batch := createTestImportBatch(t, testUserID, wallet.ID, "perf_test_100.csv")

		transactions := generateTestTransactions(100, testUserID, wallet.ID)

		start := time.Now()
		err := importRepo.CreateTransactions(context.Background(), batch.ID, transactions)
		duration := time.Since(start)

		if err != nil {
			t.Fatalf("Failed to import 100 transactions: %v", err)
		}

		t.Logf("100 transactions imported in %v (avg: %v per transaction)",
			duration, duration/100)

		// Performance expectation: Should complete in less than 2 seconds
		if duration > 2*time.Second {
			t.Errorf("Import took too long: %v (expected < 2s)", duration)
		}

		// Verify all transactions were created
		count, err := countTransactionsByBatch(batch.ID)
		if err != nil {
			t.Fatalf("Failed to count transactions: %v", err)
		}
		if count != 100 {
			t.Errorf("Expected 100 transactions, got %d", count)
		}
	})

	// Test case 2: Import 1000 transactions
	t.Run("Import 1000 transactions", func(t *testing.T) {
		wallet := createTestWallet(t, testUserID, "Perf Test Wallet 1000")
		batch := createTestImportBatch(t, testUserID, wallet.ID, "perf_test_1000.csv")

		transactions := generateTestTransactions(1000, testUserID, wallet.ID)

		start := time.Now()
		err := importRepo.CreateTransactions(context.Background(), batch.ID, transactions)
		duration := time.Since(start)

		if err != nil {
			t.Fatalf("Failed to import 1000 transactions: %v", err)
		}

		t.Logf("1000 transactions imported in %v (avg: %v per transaction)",
			duration, duration/1000)

		// Performance expectation: Should complete in less than 10 seconds
		if duration > 10*time.Second {
			t.Errorf("Import took too long: %v (expected < 10s)", duration)
		}

		// Verify all transactions were created
		count, err := countTransactionsByBatch(batch.ID)
		if err != nil {
			t.Fatalf("Failed to count transactions: %v", err)
		}
		if count != 1000 {
			t.Errorf("Expected 1000 transactions, got %d", count)
		}
	})

	// Test case 3: Import 10000 transactions
	t.Run("Import 10000 transactions", func(t *testing.T) {
		wallet := createTestWallet(t, testUserID, "Perf Test Wallet 10000")
		batch := createTestImportBatch(t, testUserID, wallet.ID, "perf_test_10000.csv")

		transactions := generateTestTransactions(10000, testUserID, wallet.ID)

		start := time.Now()
		err := importRepo.CreateTransactions(context.Background(), batch.ID, transactions)
		duration := time.Since(start)

		if err != nil {
			t.Fatalf("Failed to import 10000 transactions: %v", err)
		}

		t.Logf("10000 transactions imported in %v (avg: %v per transaction)",
			duration, duration/10000)

		// Performance expectation: Should complete in less than 60 seconds
		if duration > 60*time.Second {
			t.Errorf("Import took too long: %v (expected < 60s)", duration)
		}

		// Verify all transactions were created
		count, err := countTransactionsByBatch(batch.ID)
		if err != nil {
			t.Fatalf("Failed to count transactions: %v", err)
		}
		if count != 10000 {
			t.Errorf("Expected 10000 transactions, got %d", count)
		}
	})

	// Test case 4: Verify database transaction atomicity
	t.Run("Transaction atomicity with large batches", func(t *testing.T) {
		wallet := createTestWallet(t, testUserID, "Atomicity Test Wallet")
		batch := createTestImportBatch(t, testUserID, wallet.ID, "atomicity_test.csv")

		// Create 500 valid transactions and 1 invalid one in the middle
		transactions := generateTestTransactions(500, testUserID, wallet.ID)

		// Insert invalid transaction at position 250
		transactions[250] = models.Transaction{
			UserID:      testUserID,
			WalletID:    -1, // Invalid wallet ID - should cause failure
			Amount:      10000000,
			Type:        v1.TransactionType_TRANSACTION_TYPE_EXPENSE,
			Description: "Invalid transaction",
			Date:        time.Now(),
		}

		// This should fail and rollback all transactions
		err := importRepo.CreateTransactions(context.Background(), batch.ID, transactions)
		if err == nil {
			t.Error("Expected error for invalid transaction, got nil")
		}

		// Verify NO transactions were created (atomicity)
		count, err := countTransactionsByBatch(batch.ID)
		if err != nil {
			t.Fatalf("Failed to count transactions: %v", err)
		}
		if count != 0 {
			t.Errorf("Expected 0 transactions (rollback), got %d", count)
		}

		// Verify wallet balance was not affected
		updatedWallet, err := walletRepo.GetByID(context.Background(), wallet.ID)
		if err != nil {
			t.Fatalf("Failed to get wallet: %v", err)
		}
		if updatedWallet.Balance != wallet.Balance {
			t.Errorf("Wallet balance changed despite rollback: expected %d, got %d",
				wallet.Balance, updatedWallet.Balance)
		}
	})

	// Test case 5: Concurrent import performance
	t.Run("Concurrent imports", func(t *testing.T) {
		wallet := createTestWallet(t, testUserID, "Concurrent Test Wallet")

		// Create 10 concurrent import operations
		concurrentImports := 10
		transactionsPerImport := 100

		var wg sync.WaitGroup
		errors := make(chan error, concurrentImports)

		start := time.Now()

		for i := 0; i < concurrentImports; i++ {
			wg.Add(1)
			go func(importNum int) {
				defer wg.Done()

				batch := createTestImportBatch(t, testUserID, wallet.ID,
					fmt.Sprintf("concurrent_test_%d.csv", importNum))

				transactions := generateTestTransactions(transactionsPerImport,
					testUserID, wallet.ID)

				// Ensure unique external IDs
				for j := range transactions {
					transactions[j].ExternalID = fmt.Sprintf("CONCURRENT_%d_%05d",
						importNum, j)
				}

				err := importRepo.CreateTransactions(context.Background(),
					batch.ID, transactions)
				if err != nil {
					errors <- err
				}
			}(i)
		}

		wg.Wait()
		close(errors)
		duration := time.Since(start)

		// Check for errors
		for err := range errors {
			t.Errorf("Concurrent import error: %v", err)
		}

		t.Logf("10 concurrent imports of 100 transactions each completed in %v", duration)

		// Verify total transaction count
		totalCount, err := countTransactionsByWallet(wallet.ID)
		if err != nil {
			t.Fatalf("Failed to count transactions: %v", err)
		}

		expectedTotal := concurrentImports * transactionsPerImport
		if totalCount != expectedTotal {
			t.Errorf("Expected %d total transactions, got %d",
				expectedTotal, totalCount)
		}
	})
}

// Helper function to count transactions by batch
func countTransactionsByBatch(batchID string) (int, error) {
	var count int64
	err := testDB.Model(&models.Transaction{}).
		Where("import_batch_id = ?", batchID).
		Count(&count).Error
	return int(count), err
}

// Helper function to count transactions by wallet
func countTransactionsByWallet(walletID int32) (int, error) {
	var count int64
	err := testDB.Model(&models.Transaction{}).
		Where("wallet_id = ?", walletID).
		Count(&count).Error
	return int(count), err
}

// Note: Test helper functions are defined in test_helpers_integration.go

// TestImportService_CurrencyConversion_Integration tests the full currency conversion flow
func TestImportService_CurrencyConversion_Integration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	ctx := context.Background()

	// Setup test environment
	db, cleanup := setupTestDB(t)
	defer cleanup()

	// Setup repositories
	userRepo := setupUserRepository(db)
	walletRepo := setupWalletRepository(db)
	categoryRepo := setupCategoryRepository(db)
	transactionRepo := setupTransactionRepository(db)
	importRepo := setupImportRepository(db)
	merchantRepo := repository.NewMerchantRuleRepository(db)
	keywordRepo := repository.NewKeywordRepository(db)
	userMappingRepo := repository.NewUserMappingRepository(db)

	// Mock FX service for testing
	mockFXService := &mockFXService{
		rates: map[string]float64{
			"USD:VND": 24000.0,
			"EUR:VND": 26000.0,
		},
	}

	// Setup service with mock FX service
	importService := NewImportService(
		db,
		importRepo,
		transactionRepo,
		walletRepo,
		categoryRepo,
		merchantRepo,
		keywordRepo,
		userMappingRepo,
		mockFXService,
		nil, // jobQueue
	)

	// Create test user
	user := &models.User{
		Email:             "fx-test@example.com",
		Name:              "FX Test User",
		EmailVerified:     true,
	}
	err := userRepo.Create(ctx, user)
	require.NoError(t, err)
	require.NotZero(t, user.ID)

	// Create VND wallet
	wallet := &models.Wallet{
		UserID:     user.ID,
		WalletName: "VND Wallet",
		Balance:    0,
		Currency:   "VND",
		Type:       v1.WalletType_WALLET_TYPE_BASIC,
	}
	err = walletRepo.Create(ctx, wallet)
	require.NoError(t, err)
	require.NotZero(t, wallet.ID)

	// Create parsed transactions with USD currency
	parsedTransactions := []*v1.ParsedTransaction{
		{
			RowNumber: 1,
			Date:      time.Now().Unix(),
			Amount:    &v1.Money{Amount: 4200, Currency: "USD"}, // $42.00
			Description: "Amazon purchase",
			Type:      v1.TransactionType_TRANSACTION_TYPE_EXPENSE,
			IsValid:   true,
		},
		{
			RowNumber: 2,
			Date:      time.Now().Unix(),
			Amount:    &v1.Money{Amount: 10000, Currency: "USD"}, // $100.00
			Description: "Freelance income",
			Type:      v1.TransactionType_TRANSACTION_TYPE_INCOME,
			IsValid:   true,
		},
	}

	// Test ConvertCurrency
	convertReq := &v1.ConvertCurrencyRequest{
		WalletId:     wallet.ID,
		Transactions: parsedTransactions,
	}

	convertResp, err := importService.ConvertCurrency(ctx, user.ID, convertReq)
	require.NoError(t, err)
	require.True(t, convertResp.Success)
	require.NotNil(t, convertResp.ConvertedTransactions)
	require.Len(t, convertResp.ConvertedTransactions, 2)
	require.Len(t, convertResp.Conversions, 1)

	// Verify conversion metadata
	conversion := convertResp.Conversions[0]
	assert.Equal(t, "USD", conversion.FromCurrency)
	assert.Equal(t, "VND", conversion.ToCurrency)
	assert.Equal(t, 24000.0, conversion.ExchangeRate)
	assert.Equal(t, "auto", conversion.RateSource)
	assert.Equal(t, int32(2), conversion.TransactionCount)

	// Verify converted amounts
	convertedTx1 := convertResp.ConvertedTransactions[0]
	assert.Equal(t, "VND", convertedTx1.Amount.Currency)
	assert.Equal(t, int64(100800000), convertedTx1.Amount.Amount) // 4200 * 24000
	assert.NotNil(t, convertedTx1.OriginalAmount)
	assert.Equal(t, int64(4200), convertedTx1.OriginalAmount.Amount)
	assert.Equal(t, "USD", convertedTx1.OriginalAmount.Currency)
	assert.Equal(t, 24000.0, convertedTx1.ExchangeRate)
	assert.Equal(t, "auto", convertedTx1.ExchangeRateSource)

	// Execute import with converted transactions
	executeReq := &v1.ExecuteImportRequest{
		FileId:       "test-file-id",
		WalletId:     wallet.ID,
		Transactions: convertResp.ConvertedTransactions,
		Strategy:     v1.DuplicateHandlingStrategy_DUPLICATE_STRATEGY_KEEP_ALL,
	}

	executeResp, err := importService.ExecuteImport(ctx, user.ID, executeReq)
	require.NoError(t, err)
	require.True(t, executeResp.Success)
	require.NotNil(t, executeResp.Summary)
	assert.Equal(t, int32(2), executeResp.Summary.TotalImported)

	// Verify transactions were stored with conversion metadata
	transactions, err := transactionRepo.ListByWalletID(ctx, wallet.ID, types.PaginationParams{
		Page:     1,
		PageSize: 10,
	})
	require.NoError(t, err)
	require.Len(t, transactions, 2)

	// Check first transaction metadata
	tx1 := transactions[0]
	assert.Equal(t, "VND", tx1.Currency)
	assert.NotNil(t, tx1.OriginalAmount)
	assert.NotNil(t, tx1.OriginalCurrency)
	assert.NotNil(t, tx1.ExchangeRate)
	assert.NotNil(t, tx1.ExchangeRateSource)
	assert.Equal(t, int64(4200), *tx1.OriginalAmount)
	assert.Equal(t, "USD", *tx1.OriginalCurrency)
	assert.Equal(t, 24000.0, *tx1.ExchangeRate)
	assert.Equal(t, "auto", *tx1.ExchangeRateSource)

	t.Logf("✓ Currency conversion integration test passed")
}

// mockFXService implements FXService for testing
type mockFXService struct {
	rates map[string]float64
}

func (m *mockFXService) GetHistoricalRate(ctx context.Context, fromCurrency, toCurrency string, date time.Time) (float64, error) {
	key := fmt.Sprintf("%s:%s", fromCurrency, toCurrency)
	if rate, ok := m.rates[key]; ok {
		return rate, nil
	}
	return 0, fmt.Errorf("rate not found for %s", key)
}

func (m *mockFXService) GetLatestRate(ctx context.Context, fromCurrency, toCurrency string) (float64, error) {
	if fromCurrency == toCurrency {
		return 1.0, nil
	}
	key := fmt.Sprintf("%s:%s", fromCurrency, toCurrency)
	if rate, ok := m.rates[key]; ok {
		return rate, nil
	}
	return 0, fmt.Errorf("rate not found for %s", key)
}

func (m *mockFXService) Convert(ctx context.Context, amount int64, fromCurrency, toCurrency string, date time.Time) (int64, float64, error) {
	rate, err := m.GetHistoricalRate(ctx, fromCurrency, toCurrency, date)
	if err != nil {
		return 0, 0, err
	}
	return int64(float64(amount) * rate), rate, nil
}
