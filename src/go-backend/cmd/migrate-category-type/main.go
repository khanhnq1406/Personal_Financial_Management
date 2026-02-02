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

	log.Println("Starting category type column migration...")

	// Step 1: Check if column is already INT type
	var columnType string
	checkSQL := `
		SELECT DATA_TYPE
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'category'
		AND COLUMN_NAME = 'type'
	`
	if err := db.DB.Raw(checkSQL).Scan(&columnType).Error; err != nil {
		log.Fatalf("Failed to check column type: %v", err)
	}

	log.Printf("Current type column data type: %s", columnType)

	if columnType == "int" {
		log.Println("Column is already INT type. No migration needed.")
		return
	}

	// Step 2: Update existing VARCHAR values to integers
	// Income -> 1, Expense -> 2
	log.Println("Converting existing string values to integers...")

	// First, add a temporary column
	addTempColumnSQL := `
		ALTER TABLE category
		ADD COLUMN type_int INT
	`
	if err := db.DB.Exec(addTempColumnSQL).Error; err != nil {
		log.Printf("Note: Temporary column might already exist: %v", err)
	}

	// Map string values to integers
	updateIncomeSQL := `
		UPDATE category
		SET type_int = 1
		WHERE type = 'Income' OR type = 'income' OR type = 1
	`
	if err := db.DB.Exec(updateIncomeSQL).Error; err != nil {
		log.Printf("Warning updating income categories: %v", err)
	}

	updateExpenseSQL := `
		UPDATE category
		SET type_int = 2
		WHERE type = 'Expense' OR type = 'expense' OR type = 2
	`
	if err := db.DB.Exec(updateExpenseSQL).Error; err != nil {
		log.Printf("Warning updating expense categories: %v", err)
	}

	// Step 3: Drop the old column
	log.Println("Dropping old VARCHAR type column...")
	dropOldColumnSQL := `
		ALTER TABLE category
		DROP COLUMN type
	`
	if err := db.DB.Exec(dropOldColumnSQL).Error; err != nil {
		log.Fatalf("Failed to drop old column: %v", err)
	}

	// Step 4: Rename temporary column to 'type'
	log.Println("Renaming temporary column to 'type'...")
	renameColumnSQL := `
		ALTER TABLE category
		CHANGE COLUMN type_int type INT NOT NULL
	`
	if err := db.DB.Exec(renameColumnSQL).Error; err != nil {
		log.Fatalf("Failed to rename column: %v", err)
	}

	// Step 5: Recreate the index on the type column
	log.Println("Recreating index on type column...")
	createIndexSQL := `
		CREATE INDEX IF NOT EXISTS idx_type
		ON category(type)
	`
	if err := db.DB.Exec(createIndexSQL).Error; err != nil {
		log.Printf("Warning creating index: %v", err)
	}

	log.Println("✓ Category type column migration completed successfully!")
	log.Println("  - Column type changed from VARCHAR to INT")
	log.Println("  - Values mapped: 'Income' -> 1, 'Expense' -> 2")
	fmt.Println("\nMigration complete!")
}
