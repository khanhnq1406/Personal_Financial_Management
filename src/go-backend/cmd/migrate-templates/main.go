package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"wealthjourney/domain/models"
	"wealthjourney/pkg/config"
	"wealthjourney/pkg/database"

	"gorm.io/datatypes"
)

func main() {
	fmt.Println("Starting bank template migration...")

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

	// Auto-migrate tables
	fmt.Println("Creating/updating database tables...")
	if err := db.DB.AutoMigrate(
		&models.BankTemplate{},
		&models.UserTemplate{},
	); err != nil {
		log.Fatalf("Failed to migrate tables: %v", err)
	}
	fmt.Println("✓ Database tables migrated")

	// Seed bank templates
	ctx := context.Background()
	templates := getVietnameseBankTemplates()

	fmt.Printf("Seeding %d bank templates...\n", len(templates))
	for _, template := range templates {
		// Check if template already exists
		var existing models.BankTemplate
		result := db.DB.WithContext(ctx).Where("id = ?", template.ID).First(&existing)

		if result.Error == nil {
			// Update existing template
			template.CreatedAt = existing.CreatedAt
			template.UpdatedAt = time.Now()
			if err := db.DB.WithContext(ctx).Save(&template).Error; err != nil {
				log.Printf("Failed to update template %s: %v", template.ID, err)
				continue
			}
			fmt.Printf("✓ Updated template: %s\n", template.Name)
		} else {
			// Create new template
			template.CreatedAt = time.Now()
			template.UpdatedAt = time.Now()
			if err := db.DB.WithContext(ctx).Create(&template).Error; err != nil {
				log.Printf("Failed to create template %s: %v", template.ID, err)
				continue
			}
			fmt.Printf("✓ Created template: %s\n", template.Name)
		}
	}

	fmt.Println("\n✅ Bank template migration completed successfully!")
}

func getVietnameseBankTemplates() []models.BankTemplate {
	return []models.BankTemplate{
		// VCB Credit Card CSV
		{
			ID:            "vcb-credit-card-csv",
			Name:          "VCB Credit Card (CSV)",
			BankCode:      "VCB",
			StatementType: "credit",
			FileFormats:   datatypes.JSON([]byte(`["csv"]`)),
			ColumnMapping: datatypes.JSON([]byte(`{
				"date": ["Ngày giao dịch", "Transaction Date", "Date"],
				"amount": ["Số tiền", "Amount", "Transaction Amount"],
				"description": ["Mô tả", "Description", "Diễn giải"],
				"reference": ["Mã giao dịch", "Reference", "Transaction ID"]
			}`)),
			DateFormat: "DD/MM/YYYY",
			AmountFormat: datatypes.JSON([]byte(`{
				"decimalSeparator": ".",
				"thousandsSeparator": ",",
				"currencySymbol": "đ"
			}`)),
			Currency: "VND",
			DetectionRules: datatypes.JSON([]byte(`{
				"expectedHeaders": ["Ngày giao dịch", "Số tiền", "Mô tả"],
				"footerKeywords": ["Tổng cộng", "Total", "Balance"],
				"headerRow": 0,
				"dataStartRow": 1
			}`)),
			TypeRules: datatypes.JSON([]byte(`{
				"incomeKeywords": ["nạp tiền", "chuyển đến", "hoàn tiền", "refund", "deposit", "credit", "payment received"],
				"expenseKeywords": ["thanh toán", "mua hàng", "rút tiền", "withdraw", "purchase", "payment", "debit", "fee", "phí"]
			}`)),
			Region:   "VN",
			IsActive: true,
		},

		// Techcombank Credit Card CSV/Excel
		{
			ID:            "tcb-credit-card-csv",
			Name:          "Techcombank Credit Card (CSV/Excel)",
			BankCode:      "TCB",
			StatementType: "credit",
			FileFormats:   datatypes.JSON([]byte(`["csv", "excel"]`)),
			ColumnMapping: datatypes.JSON([]byte(`{
				"date": ["Ngày giao dịch", "Transaction Date", "Ngày GD", "Date"],
				"amount": ["Số tiền giao dịch", "Số tiền", "Amount", "Transaction Amount"],
				"description": ["Mô tả giao dịch", "Mô tả", "Description", "Merchant"],
				"reference": ["Mã tham chiếu", "Reference Number", "Authorization Code"]
			}`)),
			DateFormat: "DD/MM/YYYY",
			AmountFormat: datatypes.JSON([]byte(`{
				"decimalSeparator": ",",
				"thousandsSeparator": ".",
				"currencySymbol": "VND"
			}`)),
			Currency: "VND",
			DetectionRules: datatypes.JSON([]byte(`{
				"expectedHeaders": ["Ngày giao dịch", "Số tiền", "Mô tả"],
				"footerKeywords": ["Tổng", "Total", "Closing Balance", "Outstanding"],
				"headerRow": 0,
				"dataStartRow": 1
			}`)),
			TypeRules: datatypes.JSON([]byte(`{
				"incomeKeywords": ["nạp tiền", "chuyển khoản đến", "hoàn tiền", "refund", "credit adjustment", "reversal", "deposit"],
				"expenseKeywords": ["thanh toán", "mua sắm", "rút tiền", "ATM withdrawal", "payment", "purchase", "online purchase", "phí thường niên", "interest charge", "late fee"]
			}`)),
			Region:   "VN",
			IsActive: true,
		},

		// Vietinbank Credit Card
		{
			ID:            "vietinbank-credit-card-csv",
			Name:          "Vietinbank Credit Card (CSV)",
			BankCode:      "CTG",
			StatementType: "credit",
			FileFormats:   datatypes.JSON([]byte(`["csv"]`)),
			ColumnMapping: datatypes.JSON([]byte(`{
				"date": ["Ngày GD", "Ngày giao dịch", "Transaction Date", "Date"],
				"amount": ["Số tiền (VND)", "Số tiền", "Amount"],
				"description": ["Nội dung", "Mô tả", "Description", "Merchant Name"],
				"reference": ["Mã GD", "Transaction Code", "Reference"]
			}`)),
			DateFormat: "DD/MM/YYYY",
			AmountFormat: datatypes.JSON([]byte(`{
				"decimalSeparator": ".",
				"thousandsSeparator": ",",
				"currencySymbol": ""
			}`)),
			Currency: "VND",
			DetectionRules: datatypes.JSON([]byte(`{
				"expectedHeaders": ["Ngày GD", "Số tiền", "Nội dung"],
				"footerKeywords": ["Tổng số", "Total Amount", "Balance"],
				"headerRow": 0,
				"dataStartRow": 1
			}`)),
			TypeRules: datatypes.JSON([]byte(`{
				"incomeKeywords": ["nạp", "chuyển đến", "hoàn", "refund", "credit", "deposit"],
				"expenseKeywords": ["thanh toán", "mua", "rút", "withdraw", "payment", "purchase", "phí", "fee", "lãi", "interest"]
			}`)),
			Region:   "VN",
			IsActive: true,
		},

		// BIDV Credit Card
		{
			ID:            "bidv-credit-card-csv",
			Name:          "BIDV Credit Card (CSV)",
			BankCode:      "BIDV",
			StatementType: "credit",
			FileFormats:   datatypes.JSON([]byte(`["csv"]`)),
			ColumnMapping: datatypes.JSON([]byte(`{
				"date": ["Ngày giao dịch", "Transaction Date", "Date"],
				"amount": ["Số tiền", "Amount"],
				"description": ["Diễn giải", "Nội dung", "Description"],
				"reference": ["Số tham chiếu", "Reference No"]
			}`)),
			DateFormat: "DD/MM/YYYY",
			AmountFormat: datatypes.JSON([]byte(`{
				"decimalSeparator": ".",
				"thousandsSeparator": ",",
				"currencySymbol": "VND"
			}`)),
			Currency: "VND",
			DetectionRules: datatypes.JSON([]byte(`{
				"expectedHeaders": ["Ngày giao dịch", "Số tiền"],
				"footerKeywords": ["Tổng cộng", "Total"],
				"headerRow": 0,
				"dataStartRow": 1
			}`)),
			TypeRules: datatypes.JSON([]byte(`{
				"incomeKeywords": ["nạp tiền", "chuyển đến", "hoàn tiền", "credit"],
				"expenseKeywords": ["thanh toán", "mua hàng", "rút tiền", "phí"]
			}`)),
			Region:   "VN",
			IsActive: true,
		},

		// Generic Vietnamese Bank (Fallback)
		{
			ID:            "generic-vn-bank",
			Name:          "Generic Vietnamese Bank",
			BankCode:      "GENERIC",
			StatementType: "debit",
			FileFormats:   datatypes.JSON([]byte(`["csv", "excel"]`)),
			ColumnMapping: datatypes.JSON([]byte(`{
				"date": ["Ngày", "Date", "Ngày GD", "Transaction Date"],
				"amount": ["Số tiền", "Amount", "Value"],
				"description": ["Mô tả", "Description", "Nội dung", "Details"],
				"reference": ["Mã GD", "Reference", "Transaction ID"]
			}`)),
			DateFormat: "DD/MM/YYYY",
			AmountFormat: datatypes.JSON([]byte(`{
				"decimalSeparator": ".",
				"thousandsSeparator": ",",
				"currencySymbol": ""
			}`)),
			Currency: "VND",
			DetectionRules: datatypes.JSON([]byte(`{
				"expectedHeaders": ["Ngày", "Số tiền"],
				"footerKeywords": ["Tổng", "Total", "Sum"],
				"headerRow": 0,
				"dataStartRow": 1
			}`)),
			TypeRules: datatypes.JSON([]byte(`{
				"incomeKeywords": ["nạp", "chuyển đến", "nhận", "thu", "hoàn", "credit", "deposit", "receive", "refund"],
				"expenseKeywords": ["thanh toán", "mua", "rút", "chuyển đi", "chi", "payment", "purchase", "withdraw", "debit", "fee", "phí"]
			}`)),
			Region:   "VN",
			IsActive: true,
		},
	}
}
