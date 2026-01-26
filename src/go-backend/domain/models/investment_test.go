package models_test

import (
	"testing"
	"time"

	"wealthjourney/domain/models"
	v1 "wealthjourney/protobuf/v1"
)

func TestInvestment_TableName(t *testing.T) {
	inv := &models.Investment{}
	if inv.TableName() != "investment" {
		t.Errorf("Expected table name 'investment', got '%s'", inv.TableName())
	}
}

func TestInvestment_Fields(t *testing.T) {
	now := time.Now()
	inv := &models.Investment{
		ID:                   1,
		WalletID:             10,
		Symbol:               "BTC",
		Name:                 "Bitcoin",
		Type:                 v1.InvestmentType_INVESTMENT_TYPE_CRYPTOCURRENCY,
		Quantity:             100000000,  // 1 BTC in satoshis
		AverageCost:          50000000000, // $50,000 in cents
		TotalCost:            50000000000,
		Currency:             "USD",
		CurrentPrice:         60000000000, // $60,000
		CurrentValue:         60000000000,
		UnrealizedPNL:        10000000000, // $10,000 profit
		UnrealizedPNLPercent: 20.0,
		RealizedPNL:          0,
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	if inv.Symbol != "BTC" {
		t.Errorf("Expected symbol 'BTC', got '%s'", inv.Symbol)
	}

	if inv.Name != "Bitcoin" {
		t.Errorf("Expected name 'Bitcoin', got '%s'", inv.Name)
	}

	if inv.Type != v1.InvestmentType_INVESTMENT_TYPE_CRYPTOCURRENCY {
		t.Errorf("Expected type CRYPTOCURRENCY, got '%v'", inv.Type)
	}

	if inv.Quantity != 100000000 {
		t.Errorf("Expected quantity 100000000, got '%d'", inv.Quantity)
	}

	if inv.AverageCost != 50000000000 {
		t.Errorf("Expected average cost 50000000000, got '%d'", inv.AverageCost)
	}

	if inv.TotalCost != 50000000000 {
		t.Errorf("Expected total cost 50000000000, got '%d'", inv.TotalCost)
	}

	if inv.Currency != "USD" {
		t.Errorf("Expected currency 'USD', got '%s'", inv.Currency)
	}

	if inv.CurrentPrice != 60000000000 {
		t.Errorf("Expected current price 60000000000, got '%d'", inv.CurrentPrice)
	}

	if inv.CurrentValue != 60000000000 {
		t.Errorf("Expected current value 60000000000, got '%d'", inv.CurrentValue)
	}

	if inv.UnrealizedPNL != 10000000000 {
		t.Errorf("Expected unrealized PNL 10000000000, got '%d'", inv.UnrealizedPNL)
	}

	if inv.UnrealizedPNLPercent != 20.0 {
		t.Errorf("Expected unrealized PNL percent 20.0, got '%f'", inv.UnrealizedPNLPercent)
	}

	if inv.RealizedPNL != 0 {
		t.Errorf("Expected realized PNL 0, got '%d'", inv.RealizedPNL)
	}
}

func TestInvestment_ToProto(t *testing.T) {
	now := time.Now()
	inv := &models.Investment{
		ID:                   1,
		WalletID:             10,
		Symbol:               "AAPL",
		Name:                 "Apple Inc.",
		Type:                 v1.InvestmentType_INVESTMENT_TYPE_STOCK,
		Quantity:             10000, // 1 share in 4 decimal places
		AverageCost:          150000, // $150.00 in cents
		TotalCost:            150000,
		Currency:             "USD",
		CurrentPrice:         175000, // $175.00
		CurrentValue:         175000,
		UnrealizedPNL:        25000,  // $25.00 profit
		UnrealizedPNLPercent: 16.67,
		RealizedPNL:          0,
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	proto := inv.ToProto()

	if proto.Id != int32(1) {
		t.Errorf("Expected ID 1, got '%d'", proto.Id)
	}

	if proto.WalletId != int32(10) {
		t.Errorf("Expected WalletID 10, got '%d'", proto.WalletId)
	}

	if proto.Symbol != "AAPL" {
		t.Errorf("Expected symbol 'AAPL', got '%s'", proto.Symbol)
	}

	if proto.Name != "Apple Inc." {
		t.Errorf("Expected name 'Apple Inc.', got '%s'", proto.Name)
	}

	if proto.Type != v1.InvestmentType_INVESTMENT_TYPE_STOCK {
		t.Errorf("Expected type STOCK, got '%v'", proto.Type)
	}

	if proto.Quantity != int64(10000) {
		t.Errorf("Expected quantity 10000, got '%d'", proto.Quantity)
	}

	if proto.AverageCost != int64(150000) {
		t.Errorf("Expected average cost 150000, got '%d'", proto.AverageCost)
	}

	if proto.TotalCost != int64(150000) {
		t.Errorf("Expected total cost 150000, got '%d'", proto.TotalCost)
	}

	if proto.Currency != "USD" {
		t.Errorf("Expected currency 'USD', got '%s'", proto.Currency)
	}

	if proto.CurrentPrice != int64(175000) {
		t.Errorf("Expected current price 175000, got '%d'", proto.CurrentPrice)
	}

	if proto.CurrentValue != int64(175000) {
		t.Errorf("Expected current value 175000, got '%d'", proto.CurrentValue)
	}

	if proto.UnrealizedPnl != int64(25000) {
		t.Errorf("Expected unrealized PNL 25000, got '%d'", proto.UnrealizedPnl)
	}

	if proto.UnrealizedPnlPercent != 16.67 {
		t.Errorf("Expected unrealized PNL percent 16.67, got '%f'", proto.UnrealizedPnlPercent)
	}

	if proto.RealizedPnl != int64(0) {
		t.Errorf("Expected realized PNL 0, got '%d'", proto.RealizedPnl)
	}

	if proto.CreatedAt != now.Unix() {
		t.Errorf("Expected created at %d, got '%d'", now.Unix(), proto.CreatedAt)
	}

	if proto.UpdatedAt != now.Unix() {
		t.Errorf("Expected updated at %d, got '%d'", now.Unix(), proto.UpdatedAt)
	}
}

func TestInvestment_CalculationLogic(t *testing.T) {
	// Test that the model properly holds and returns calculated values
	inv := &models.Investment{
		Quantity:             100000000, // 1 BTC in satoshis
		TotalCost:            50000000000, // $50,000
		CurrentPrice:         60000000000, // $60,000
		CurrentValue:         60000000000, // $60,000 (calculated)
		UnrealizedPNL:        10000000000, // $10,000 profit
		UnrealizedPNLPercent: 20.0,
	}

	// Verify the values are stored correctly
	if inv.CurrentValue != 60000000000 {
		t.Errorf("Expected current value 60000000000, got %d", inv.CurrentValue)
	}

	if inv.UnrealizedPNL != 10000000000 {
		t.Errorf("Expected unrealized PNL 10000000000, got %d", inv.UnrealizedPNL)
	}

	if inv.UnrealizedPNLPercent != 20.0 {
		t.Errorf("Expected unrealized PNL percent 20.0, got %f", inv.UnrealizedPNLPercent)
	}
}

func TestInvestment_TypeAwareRecalculation(t *testing.T) {
	tests := []struct {
		name              string
		investmentType    v1.InvestmentType
		quantity          int64
		totalCost         int64
		currentPrice      int64
		expectedValue     int64
		expectedPNL       int64
		expectedPNLPct    float64
	}{
		{
			name:           "Cryptocurrency - BTC",
			investmentType: v1.InvestmentType_INVESTMENT_TYPE_CRYPTOCURRENCY,
			quantity:       100000000,    // 1 BTC in satoshis
			totalCost:      50000000000,  // $50,000
			currentPrice:   60000000000,  // $60,000
			expectedValue:  60000000000,  // $60,000
			expectedPNL:    10000000000,  // $10,000 profit
			expectedPNLPct: 20.0,
		},
		{
			name:           "Stock - AAPL",
			investmentType: v1.InvestmentType_INVESTMENT_TYPE_STOCK,
			quantity:       10000,        // 1 share in 4 decimals
			totalCost:      1500000,      // $150.00
			currentPrice:   1750000,      // $175.00
			expectedValue:  1750000,      // $175.00
			expectedPNL:    250000,       // $25.00 profit
			expectedPNLPct: 16.666666666666668,
		},
		{
			name:           "ETF - VOO",
			investmentType: v1.InvestmentType_INVESTMENT_TYPE_ETF,
			quantity:       5000,         // 0.5 shares in 4 decimals
			totalCost:      2000000,      // $200.00
			currentPrice:   4200000,      // $420.00
			expectedValue:  2100000,      // $210.00 (0.5 * 420)
			expectedPNL:    100000,       // $10.00 profit
			expectedPNLPct: 5.0,
		},
		{
			name:           "Mutual Fund - VFIAX",
			investmentType: v1.InvestmentType_INVESTMENT_TYPE_MUTUAL_FUND,
			quantity:       10000,        // 1 share in 4 decimals
			totalCost:      4000000,      // $400.00
			currentPrice:   4500000,      // $450.00
			expectedValue:  4500000,      // $450.00
			expectedPNL:    500000,       // $50.00 profit
			expectedPNLPct: 12.5,
		},
		{
			name:           "Other type - default divisor",
			investmentType: v1.InvestmentType_INVESTMENT_TYPE_OTHER,
			quantity:       100,          // 1 unit in 2 decimals
			totalCost:      10000,        // $100.00
			currentPrice:   12000,        // $120.00
			expectedValue:  12000,        // $120.00
			expectedPNL:    2000,         // $20.00 profit
			expectedPNLPct: 20.0,
		},
		{
			name:           "Loss scenario - stock",
			investmentType: v1.InvestmentType_INVESTMENT_TYPE_STOCK,
			quantity:       10000,        // 1 share
			totalCost:      2000000,      // $200.00
			currentPrice:   1500000,      // $150.00
			expectedValue:  1500000,      // $150.00
			expectedPNL:    -500000,      // $50.00 loss
			expectedPNLPct: -25.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			inv := &models.Investment{
				Type:         tt.investmentType,
				Quantity:     tt.quantity,
				TotalCost:    tt.totalCost,
				CurrentPrice: tt.currentPrice,
			}

			// Trigger recalculation via BeforeUpdate (simulating GORM hook)
			inv.BeforeUpdate(nil)

			if inv.CurrentValue != tt.expectedValue {
				t.Errorf("Expected current value %d, got %d", tt.expectedValue, inv.CurrentValue)
			}

			if inv.UnrealizedPNL != tt.expectedPNL {
				t.Errorf("Expected unrealized PNL %d, got %d", tt.expectedPNL, inv.UnrealizedPNL)
			}

			// Allow small floating point differences
			pnlPctDiff := inv.UnrealizedPNLPercent - tt.expectedPNLPct
			if pnlPctDiff < -0.01 || pnlPctDiff > 0.01 {
				t.Errorf("Expected unrealized PNL percent %.2f, got %.2f", tt.expectedPNLPct, inv.UnrealizedPNLPercent)
			}
		})
	}
}

func TestInvestment_ZeroValueEdgeCases(t *testing.T) {
	tests := []struct {
		name              string
		quantity          int64
		totalCost         int64
		currentPrice      int64
		typeValue         v1.InvestmentType
		expectedValue     int64
		expectedPNL       int64
		expectedPNLPct    float64
	}{
		{
			name:           "Zero quantity with cost",
			quantity:       0,
			totalCost:      100000000,
			currentPrice:   50000000,
			typeValue:      v1.InvestmentType_INVESTMENT_TYPE_STOCK,
			expectedValue:  0,
			expectedPNL:    -100000000,
			expectedPNLPct: -100.0,
		},
		{
			name:           "Zero price with cost",
			quantity:       100000000,
			totalCost:      50000000000,
			currentPrice:   0,
			typeValue:      v1.InvestmentType_INVESTMENT_TYPE_CRYPTOCURRENCY,
			expectedValue:  0,
			expectedPNL:    -50000000000,
			expectedPNLPct: -100.0,
		},
		{
			name:           "Zero total cost",
			quantity:       100000000,
			totalCost:      0,
			currentPrice:   60000000000,
			typeValue:      v1.InvestmentType_INVESTMENT_TYPE_CRYPTOCURRENCY,
			expectedValue:  60000000000,
			expectedPNL:    60000000000,
			expectedPNLPct: 0, // Division by zero avoided in code
		},
		{
			name:           "All zeros",
			quantity:       0,
			totalCost:      0,
			currentPrice:   0,
			typeValue:      v1.InvestmentType_INVESTMENT_TYPE_STOCK,
			expectedValue:  0,
			expectedPNL:    0,
			expectedPNLPct: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			inv := &models.Investment{
				Type:         tt.typeValue,
				Quantity:     tt.quantity,
				TotalCost:    tt.totalCost,
				CurrentPrice: tt.currentPrice,
			}

			// Trigger recalculation
			inv.BeforeUpdate(nil)

			if inv.CurrentValue != tt.expectedValue {
				t.Errorf("Expected current value %d, got %d", tt.expectedValue, inv.CurrentValue)
			}

			if inv.UnrealizedPNL != tt.expectedPNL {
				t.Errorf("Expected unrealized PNL %d, got %d", tt.expectedPNL, inv.UnrealizedPNL)
			}

			if inv.UnrealizedPNLPercent != tt.expectedPNLPct {
				t.Errorf("Expected unrealized PNL percent %.2f, got %.2f", tt.expectedPNLPct, inv.UnrealizedPNLPercent)
			}
		})
	}
}

func TestInvestment_GORMHooks(t *testing.T) {
	tests := []struct {
		name           string
		hook           func(*models.Investment) error
		initialValue   int64
		initialPrice   int64
		expectedValue  int64
	}{
		{
			name: "BeforeCreate hook triggers recalculation",
			hook: func(inv *models.Investment) error {
				return inv.BeforeCreate(nil)
			},
			initialValue:  0,
			initialPrice:  60000000000,
			expectedValue: 60000000000,
		},
		{
			name: "BeforeUpdate hook triggers recalculation",
			hook: func(inv *models.Investment) error {
				return inv.BeforeUpdate(nil)
			},
			initialValue:  0,
			initialPrice:  60000000000,
			expectedValue: 60000000000,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			inv := &models.Investment{
				Type:         v1.InvestmentType_INVESTMENT_TYPE_CRYPTOCURRENCY,
				Quantity:     100000000, // 1 BTC
				TotalCost:    50000000000,
				CurrentValue: tt.initialValue,
				CurrentPrice: tt.initialPrice,
			}

			// Call the hook
			err := tt.hook(inv)
			if err != nil {
				t.Errorf("Hook returned error: %v", err)
			}

			// Verify recalculation occurred
			if inv.CurrentValue != tt.expectedValue {
				t.Errorf("Expected current value %d after hook, got %d", tt.expectedValue, inv.CurrentValue)
			}

			if inv.UnrealizedPNL != 10000000000 {
				t.Errorf("Expected unrealized PNL 10000000000 after hook, got %d", inv.UnrealizedPNL)
			}
		})
	}
}

