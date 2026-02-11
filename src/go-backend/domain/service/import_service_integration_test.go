//go:build integration

package service

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"wealthjourney/domain/models"
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

	// Setup service
	importService := NewImportService(importRepo, transactionRepo, walletRepo, categoryRepo)

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

	t.Skip("TODO: Implement duplicate detection test")

	// TODO: Test cases to implement:
	// 1. Import same transactions twice - should detect duplicates
	// 2. Test fuzzy matching with similar amounts/dates
	// 3. Test exact match detection
	// 4. Verify duplicate count in import summary
}

// TestImportService_BulkInsertPerformance tests performance of bulk transaction creation
func TestImportService_BulkInsertPerformance(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	t.Skip("TODO: Implement performance benchmark test")

	// TODO: Test cases to implement:
	// 1. Import 100 transactions - measure time
	// 2. Import 1000 transactions - measure time
	// 3. Import 10000 transactions - measure time
	// 4. Verify database transaction atomicity with large batches
}

// Note: Test helper functions are defined in test_helpers_integration.go
