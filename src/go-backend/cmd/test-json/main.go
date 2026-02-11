package main

import (
	"encoding/json"
	"fmt"
	"log"

	"wealthjourney/domain/models"
	"wealthjourney/pkg/config"
	"wealthjourney/pkg/database"
)

func main() {
	fmt.Println("Testing JSON insertion...")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize database
	db, err := database.New(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Create a simple template
	template := models.BankTemplate{
		ID:            "test-template",
		Name:          "Test Template",
		BankCode:      "TEST",
		StatementType: "credit",
		FileFormats:   models.JSONArray{"csv"},
		ColumnMapping: models.ColumnMapping{
			Date:        []string{"Date"},
			Amount:      []string{"Amount"},
			Description: []string{"Description"},
		},
		DateFormat: "DD/MM/YYYY",
		AmountFormat: models.AmountFormat{
			DecimalSeparator:   ".",
			ThousandsSeparator: ",",
			CurrencySymbol:     "$",
		},
		Currency: "USD",
		DetectionRules: models.DetectionRules{
			ExpectedHeaders: []string{"Date", "Amount"},
			FooterKeywords:  []string{"Total"},
			HeaderRow:       0,
			DataStartRow:    1,
		},
		TypeRules: models.TypeRules{
			IncomeKeywords:  []string{"credit", "deposit"},
			ExpenseKeywords: []string{"payment", "debit"},
		},
		Region:   "US",
		IsActive: true,
	}

	// Try to print the JSON that will be saved
	jsonData, err := json.MarshalIndent(template, "", "  ")
	if err != nil {
		log.Fatalf("Failed to marshal: %v", err)
	}
	fmt.Printf("JSON to insert:\n%s\n\n", string(jsonData))

	// Try to insert
	fmt.Println("Attempting to insert...")
	result := db.DB.Create(&template)
	if result.Error != nil {
		log.Fatalf("Failed to insert: %v", result.Error)
	}

	fmt.Println("✓ Successfully inserted test template")

	// Try to retrieve it
	var retrieved models.BankTemplate
	if err := db.DB.Where("id = ?", "test-template").First(&retrieved).Error; err != nil {
		log.Fatalf("Failed to retrieve: %v", err)
	}

	fmt.Printf("✓ Successfully retrieved template: %s\n", retrieved.Name)

	// Print retrieved JSON
	jsonRetrieved, _ := json.MarshalIndent(retrieved, "", "  ")
	fmt.Printf("Retrieved JSON:\n%s\n", string(jsonRetrieved))

	// Clean up
	if err := db.DB.Unscoped().Delete(&retrieved).Error; err != nil {
		log.Printf("Warning: Failed to cleanup: %v", err)
	}

	fmt.Println("✅ Test completed successfully!")
}
