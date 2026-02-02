package main

import (
	"context"
	"flag"
	"log"

	v1 "wealthjourney/protobuf/v1"

	"wealthjourney/domain/models"
	"wealthjourney/pkg/config"
	"wealthjourney/pkg/database"
)

func main() {
	dryRun := flag.Bool("dry-run", true, "Run without making changes")
	flag.Parse()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	db, err := database.New(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	ctx := context.Background()

	// Get all INVESTMENT type wallets
	var wallets []models.Wallet
	if err := db.DB.WithContext(ctx).Where("type = ?", int32(v1.WalletType_INVESTMENT)).Find(&wallets).Error; err != nil {
		log.Fatalf("Failed to fetch investment wallets: %v", err)
	}

	log.Printf("Found %d investment wallets to process", len(wallets))

	for _, wallet := range wallets {
		log.Printf("\nProcessing wallet ID %d (balance: %d)", wallet.ID, wallet.Balance)

		// Get all investments for this wallet
		var investments []models.Investment
		if err := db.DB.WithContext(ctx).Where("wallet_id = ?", wallet.ID).Find(&investments).Error; err != nil {
			log.Printf("  ERROR: Failed to fetch investments: %v", err)
			continue
		}

		var walletBalanceDelta int64 = 0
		var totalDividendsSum int64 = 0

		for _, investment := range investments {
			log.Printf("  Investment: %s (%s)", investment.Symbol, investment.Name)

			// Get all transactions for this investment, ordered by date ASC
			var transactions []models.InvestmentTransaction
			if err := db.DB.WithContext(ctx).
				Where("investment_id = ?", investment.ID).
				Order("transaction_date ASC").
				Find(&transactions).Error; err != nil {
				log.Printf("    ERROR: Failed to fetch transactions: %v", err)
				continue
			}

			var investmentDividends int64 = 0

			for _, tx := range transactions {
				switch tx.Type {
				case v1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_BUY:
					// BUY: -(cost + fees)
					delta := -(tx.Cost + tx.Fees)
					walletBalanceDelta += delta
					log.Printf("    BUY: %d (delta: %d)", tx.Cost+tx.Fees, delta)

				case v1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_SELL:
					// SELL: +(cost - fees)
					delta := tx.Cost - tx.Fees
					walletBalanceDelta += delta
					log.Printf("    SELL: %d (delta: %d)", tx.Cost, delta)

				case v1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_DIVIDEND:
					// DIVIDEND: +cost
					walletBalanceDelta += tx.Cost
					investmentDividends += tx.Cost
					log.Printf("    DIVIDEND: %d", tx.Cost)
				}
			}

			totalDividendsSum += investmentDividends

			// Update investment.TotalDividends
			if investmentDividends > 0 && !*dryRun {
				if err := db.DB.WithContext(ctx).Model(&investment).Update("total_dividends", investmentDividends).Error; err != nil {
					log.Printf("    ERROR: Failed to update TotalDividends: %v", err)
				}
			}
			log.Printf("    Total dividends for investment: %d", investmentDividends)
		}

		log.Printf("  Wallet balance delta: %d", walletBalanceDelta)
		log.Printf("  Total dividends sum: %d", totalDividendsSum)

		// Calculate new wallet balance
		// Note: We ADD the delta to current balance (which accounts for manual AddFunds/TransferFunds)
		// This assumes wallet balance was manually funded and transactions should now be reflected
		newBalance := wallet.Balance + walletBalanceDelta

		if *dryRun {
			log.Printf("  [DRY RUN] Would update wallet balance: %d -> %d", wallet.Balance, newBalance)
		} else {
			if err := db.DB.WithContext(ctx).Model(&wallet).Update("balance", newBalance).Error; err != nil {
				log.Printf("  ERROR: Failed to update wallet balance: %v", err)
				continue
			}
			log.Printf("  Updated wallet balance: %d -> %d", wallet.Balance, newBalance)
		}
	}

	if *dryRun {
		log.Println("\n[DRY RUN] No changes were made. Run with -dry-run=false to apply changes.")
	} else {
		log.Println("\nMigration completed successfully.")
	}
}
