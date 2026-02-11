//go:build integration

package service

import (
	"wealthjourney/domain/repository"
	"wealthjourney/pkg/database"
)

// setupUserRepository creates a user repository for testing
func setupUserRepository(db *database.Database) repository.UserRepository {
	return repository.NewUserRepository(db)
}

// setupWalletRepository creates a wallet repository for testing
func setupWalletRepository(db *database.Database) repository.WalletRepository {
	return repository.NewWalletRepository(db)
}

// setupCategoryRepository creates a category repository for testing
func setupCategoryRepository(db *database.Database) repository.CategoryRepository {
	return repository.NewCategoryRepository(db)
}

// setupTransactionRepository creates a transaction repository for testing
func setupTransactionRepository(db *database.Database) repository.TransactionRepository {
	return repository.NewTransactionRepository(db)
}

// setupFXRateRepository creates an FX rate repository for testing
func setupFXRateRepository(db *database.Database) repository.FXRateRepository {
	return repository.NewFXRateRepository(db)
}

// setupImportRepository creates an import repository for testing
func setupImportRepository(db *database.Database) repository.ImportRepository {
	return repository.NewImportRepository(db)
}
