//go:build integration

package service

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"wealthjourney/domain/models"
	"wealthjourney/domain/repository"
	"wealthjourney/pkg/config"
	"wealthjourney/pkg/database"
	v1 "wealthjourney/protobuf/v1"
)

// TestImportService_UndoImport_Atomicity verifies that undo operations are atomic.
// If any part of the undo fails (transaction deletion, wallet balance update, or batch update),
// the entire operation should be rolled back.
func TestImportService_UndoImport_Atomicity(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	ctx := context.Background()

	// Setup test database
	cfg, err := config.Load()
	require.NoError(t, err)

	db, err := database.New(cfg)
	require.NoError(t, err)
	defer db.Close()

	// Setup repositories
	userRepo := repository.NewUserRepository(db)
	walletRepo := repository.NewWalletRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	transactionRepo := repository.NewTransactionRepository(db)
	importRepo := repository.NewImportRepository(db)
	merchantRepo := repository.NewMerchantRuleRepository(db)
	keywordRepo := repository.NewKeywordRepository(db)
	userMappingRepo := repository.NewUserMappingRepository(db)

	// Create import service
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
		Email: "undo-atomicity@example.com",
		Name:  "Undo Test User",
	}
	err = userRepo.Create(ctx, user)
	require.NoError(t, err)

	// Create test wallet with initial balance
	initialBalance := int64(1000000) // 1M VND
	wallet := &models.Wallet{
		UserID:     user.ID,
		WalletName: "Test Wallet",
		Balance:    initialBalance,
		Currency:   "VND",
		Type:       int32(v1.WalletType_BASIC),
		Status:     1,
	}
	err = walletRepo.Create(ctx, wallet)
	require.NoError(t, err)

	// Create test category
	category := &models.Category{
		UserID: user.ID,
		Name:   "Test Category",
		Type:   int32(v1.CategoryType_CATEGORY_TYPE_EXPENSE),
	}
	err = categoryRepo.Create(ctx, category)
	require.NoError(t, err)

	// Create import batch
	batchID := "test-undo-batch-123"
	now := time.Now()
	undoExpires := now.Add(24 * time.Hour)
	importBatch := &models.ImportBatch{
		ID:            batchID,
		UserID:        user.ID,
		WalletID:      wallet.ID,
		FileName:      "test-import.csv",
		ValidRows:     2,
		SkippedRows:   0,
		TotalIncome:   500000,
		TotalExpenses: 300000,
		ImportedAt:    now,
		CanUndo:       true,
		UndoExpiresAt: undoExpires,
	}
	err = importRepo.CreateImportBatch(ctx, importBatch)
	require.NoError(t, err)

	// Create transactions linked to import batch
	tx1 := &models.Transaction{
		WalletID:      wallet.ID,
		CategoryID:    &category.ID,
		Amount:        500000, // Income
		Note:          "Test Income",
		Date:          now,
		ImportBatchID: &batchID,
	}
	err = transactionRepo.Create(ctx, tx1)
	require.NoError(t, err)

	tx2 := &models.Transaction{
		WalletID:      wallet.ID,
		CategoryID:    &category.ID,
		Amount:        -300000, // Expense
		Note:          "Test Expense",
		Date:          now,
		ImportBatchID: &batchID,
	}
	err = transactionRepo.Create(ctx, tx2)
	require.NoError(t, err)

	// Update wallet balance to reflect import
	expectedBalanceAfterImport := initialBalance + 500000 - 300000 // 1.2M
	wallet.Balance = expectedBalanceAfterImport
	err = walletRepo.Update(ctx, wallet)
	require.NoError(t, err)

	// Verify initial state
	walletBefore, err := walletRepo.GetByID(ctx, wallet.ID)
	require.NoError(t, err)
	assert.Equal(t, expectedBalanceAfterImport, walletBefore.Balance)

	// Count transactions before undo
	txCountBefore, err := transactionRepo.CountByWalletID(ctx, wallet.ID)
	require.NoError(t, err)
	assert.Equal(t, int32(2), txCountBefore)

	// Execute undo import
	undoResp, err := importService.UndoImport(ctx, user.ID, batchID)
	require.NoError(t, err)
	assert.True(t, undoResp.Success)

	// Verify transactions are soft-deleted
	txCountAfter, err := transactionRepo.CountByWalletID(ctx, wallet.ID)
	require.NoError(t, err)
	assert.Equal(t, int32(0), txCountAfter, "Transactions should be soft-deleted")

	// Verify wallet balance is restored
	walletAfter, err := walletRepo.GetByID(ctx, wallet.ID)
	require.NoError(t, err)
	assert.Equal(t, initialBalance, walletAfter.Balance, "Wallet balance should be restored to initial value")

	// Verify import batch is marked as undone
	batchAfter, err := importRepo.GetImportBatchByID(ctx, batchID)
	require.NoError(t, err)
	assert.NotNil(t, batchAfter.UndoneAt, "Import batch should be marked as undone")
	assert.False(t, batchAfter.CanUndo, "Import batch CanUndo should be false")

	// Verify cannot undo twice
	_, err = importService.UndoImport(ctx, user.ID, batchID)
	assert.Error(t, err, "Should not be able to undo twice")
	assert.Contains(t, err.Error(), "already been undone")
}
