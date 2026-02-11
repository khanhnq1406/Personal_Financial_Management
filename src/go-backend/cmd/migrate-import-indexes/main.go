package main

import (
	"fmt"
	"log"

	"wealthjourney/pkg/config"
	"wealthjourney/pkg/database"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	db, err := database.New(cfg)
	if err != nil {
		log.Fatal(err)
	}

	// Add composite index for duplicate detection by date and amount
	// This optimizes Level 2-3 duplicate detection queries
	sql1 := `
		CREATE INDEX IF NOT EXISTS idx_transaction_wallet_date_amount
		ON transaction (wallet_id, date, amount);
	`

	if err := db.DB.Exec(sql1).Error; err != nil {
		log.Fatal(err)
	}

	fmt.Println("Index idx_transaction_wallet_date_amount created successfully")

	// Add composite index for duplicate detection by external_id
	// This optimizes Level 1 duplicate detection (unique reference numbers)
	sql2 := `
		CREATE INDEX IF NOT EXISTS idx_transaction_wallet_external_id
		ON transaction (wallet_id, external_id);
	`

	if err := db.DB.Exec(sql2).Error; err != nil {
		log.Fatal(err)
	}

	fmt.Println("Index idx_transaction_wallet_external_id created successfully")
	fmt.Println("All import indexes created successfully")
}
