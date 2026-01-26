package main

import (
	"log"

	"wealthjourney/domain/models"
	"wealthjourney/pkg/config"
	"wealthjourney/pkg/database"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	// Connect to database
	db, err := database.New(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto-migrate investment models
	err = db.DB.AutoMigrate(
		&models.Investment{},
		&models.InvestmentTransaction{},
		&models.InvestmentLot{},
		&models.MarketData{},
	)

	if err != nil {
		log.Fatal("Failed to migrate investment tables:", err)
	}

	log.Println("Investment tables migrated successfully")
}
