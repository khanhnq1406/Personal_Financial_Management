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

	// Add composite index for category type lookups
	// This optimizes: filtering categories by type, and JOINs when filtering transactions by type
	sql := `
		CREATE INDEX IF NOT EXISTS idx_category_user_type
		ON category(user_id, type);
	`

	if err := db.DB.Exec(sql).Error; err != nil {
		log.Fatal(err)
	}

	fmt.Println("Index idx_category_user_type created successfully")
}
