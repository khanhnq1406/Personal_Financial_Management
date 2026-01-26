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
