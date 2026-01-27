package units

import (
	"testing"
	"wealthjourney/protobuf/v1"
)

func TestGetPrecisionForInvestmentType(t *testing.T) {
	tests := []struct {
		name           string
		investmentType v1.InvestmentType
		expected       DecimalPrecision
	}{
		{"Cryptocurrency", v1.InvestmentType_INVESTMENT_TYPE_CRYPTOCURRENCY, Precision8Decimals},
		{"Stock", v1.InvestmentType_INVESTMENT_TYPE_STOCK, Precision4Decimals},
		{"ETF", v1.InvestmentType_INVESTMENT_TYPE_ETF, Precision4Decimals},
		{"Mutual Fund", v1.InvestmentType_INVESTMENT_TYPE_MUTUAL_FUND, Precision4Decimals},
		{"Unknown (default)", v1.InvestmentType(99), Precision4Decimals},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := GetPrecisionForInvestmentType(tt.investmentType)
			if result != tt.expected {
				t.Errorf("GetPrecisionForInvestmentType() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestQuantityConversions(t *testing.T) {
	tests := []struct {
		name           string
		investmentType v1.InvestmentType
		input          float64
		precision      DecimalPrecision
	}{
		{"1 BTC", v1.InvestmentType_INVESTMENT_TYPE_CRYPTOCURRENCY, 1.0, Precision8Decimals},
		{"0.5 BTC", v1.InvestmentType_INVESTMENT_TYPE_CRYPTOCURRENCY, 0.5, Precision8Decimals},
		{"0.00000001 BTC (1 satoshi)", v1.InvestmentType_INVESTMENT_TYPE_CRYPTOCURRENCY, 0.00000001, Precision8Decimals},
		{"100 shares", v1.InvestmentType_INVESTMENT_TYPE_STOCK, 100.0, Precision4Decimals},
		{"0.0001 shares", v1.InvestmentType_INVESTMENT_TYPE_STOCK, 0.0001, Precision4Decimals},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Convert to storage
			stored := QuantityToStorage(tt.input, tt.investmentType)
			expectedStored := int64(tt.input * float64(tt.precision))
			if stored != expectedStored {
				t.Errorf("QuantityToStorage(%f) = %d, want %d", tt.input, stored, expectedStored)
			}

			// Convert back to display
			restored := QuantityFromStorage(stored, tt.investmentType)
			if restored != tt.input {
				t.Errorf("Round-trip failed: %f → %d → %f (want %f)",
					tt.input, stored, restored, tt.input)
			}
		})
	}
}

func TestCurrencyConversions(t *testing.T) {
	tests := []struct {
		name     string
		dollars  float64
		expected int64
	}{
		{"$100.00", 100.0, 10000},
		{"$0.01", 0.01, 1},
		{"$1234.56", 1234.56, 123456},
		{"$60000.00", 60000.0, 6000000},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cents := DollarsToCents(tt.dollars)
			if cents != tt.expected {
				t.Errorf("DollarsToCents(%f) = %d, want %d", tt.dollars, cents, tt.expected)
			}

			dollars := CentsToDollars(cents)
			if dollars != tt.dollars {
				t.Errorf("CentsToDollars(%d) = %f, want %f", cents, dollars, tt.dollars)
			}
		})
	}
}

func TestCalculateTransactionCost(t *testing.T) {
	tests := []struct {
		name           string
		investmentType v1.InvestmentType
		quantity       float64
		priceCents     int64
		expectedCost   int64
	}{
		{
			name:           "Buy 1 BTC @ $60,000",
			investmentType: v1.InvestmentType_INVESTMENT_TYPE_CRYPTOCURRENCY,
			quantity:       1.0,
			priceCents:     6000000, // $60,000 in cents
			expectedCost:   6000000, // Should be $60,000
		},
		{
			name:           "Buy 0.5 BTC @ $60,000",
			investmentType: v1.InvestmentType_INVESTMENT_TYPE_CRYPTOCURRENCY,
			quantity:       0.5,
			priceCents:     6000000,
			expectedCost:   3000000, // $30,000
		},
		{
			name:           "Buy 100 shares @ $100",
			investmentType: v1.InvestmentType_INVESTMENT_TYPE_STOCK,
			quantity:       100.0,
			priceCents:     10000, // $100 in cents
			expectedCost:   1000000, // $10,000
		},
		{
			name:           "Buy 50.5 shares @ $50",
			investmentType: v1.InvestmentType_INVESTMENT_TYPE_STOCK,
			quantity:       50.5,
			priceCents:     5000, // $50 in cents
			expectedCost:   252500, // $2,525
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			quantity := QuantityToStorage(tt.quantity, tt.investmentType)
			cost := CalculateTransactionCost(quantity, tt.priceCents, tt.investmentType)

			if cost != tt.expectedCost {
				t.Errorf("CalculateTransactionCost() = %d, want %d", cost, tt.expectedCost)
			}
		})
	}
}

func TestCalculateAverageCost(t *testing.T) {
	tests := []struct {
		name           string
		investmentType v1.InvestmentType
		totalCost      int64
		quantity       float64
		expectedAvg    int64
	}{
		{
			name:           "1 BTC @ $60,000",
			investmentType: v1.InvestmentType_INVESTMENT_TYPE_CRYPTOCURRENCY,
			totalCost:      6000000, // $60,000 in cents
			quantity:       1.0,
			expectedAvg:    6000000, // $60,000 per BTC in cents
		},
		{
			name:           "2 BTC @ $60,000 total = $30,000 avg",
			investmentType: v1.InvestmentType_INVESTMENT_TYPE_CRYPTOCURRENCY,
			totalCost:      6000000, // $60,000 total
			quantity:       2.0,
			expectedAvg:    3000000, // $30,000 per BTC
		},
		{
			name:           "100 shares @ $100 each",
			investmentType: v1.InvestmentType_INVESTMENT_TYPE_STOCK,
			totalCost:      1000000, // $10,000 in cents
			quantity:       100.0,
			expectedAvg:    10000, // $100 per share in cents
		},
		{
			name:           "50 shares @ $50 each",
			investmentType: v1.InvestmentType_INVESTMENT_TYPE_STOCK,
			totalCost:      2500000, // $25,000 in cents
			quantity:       50.0,
			expectedAvg:    50000, // $500 per share in cents
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			quantity := QuantityToStorage(tt.quantity, tt.investmentType)
			avgCost := CalculateAverageCost(tt.totalCost, quantity, tt.investmentType)

			if avgCost != tt.expectedAvg {
				t.Errorf("CalculateAverageCost() = %d, want %d", avgCost, tt.expectedAvg)
			}
		})
	}
}

func TestCalculateCurrentValue(t *testing.T) {
	tests := []struct {
		name           string
		investmentType v1.InvestmentType
		quantity       float64
		priceCents     int64
		expectedValue  int64
	}{
		{
			name:           "1 BTC @ $70,000 current price",
			investmentType: v1.InvestmentType_INVESTMENT_TYPE_CRYPTOCURRENCY,
			quantity:       1.0,
			priceCents:     7000000, // $70,000
			expectedValue:  7000000,
		},
		{
			name:           "100 shares @ $150 current price",
			investmentType: v1.InvestmentType_INVESTMENT_TYPE_STOCK,
			quantity:       100.0,
			priceCents:     15000, // $150
			expectedValue:  1500000, // $15,000
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			quantity := QuantityToStorage(tt.quantity, tt.investmentType)
			value := CalculateCurrentValue(quantity, tt.priceCents, tt.investmentType)

			if value != tt.expectedValue {
				t.Errorf("CalculateCurrentValue() = %d, want %d", value, tt.expectedValue)
			}
		})
	}
}

func TestCalculateUnrealizedPNL(t *testing.T) {
	tests := []struct {
		name             string
		currentValue     int64
		totalCost        int64
		expectedPNL      int64
		expectedPercent  float64
	}{
		{
			name:            "Profit: $70K value, $60K cost",
			currentValue:    7000000,
			totalCost:       6000000,
			expectedPNL:     1000000,
			expectedPercent: 16.666666666666668,
		},
		{
			name:            "Loss: $50K value, $60K cost",
			currentValue:    5000000,
			totalCost:       6000000,
			expectedPNL:     -1000000,
			expectedPercent: -16.666666666666668,
		},
		{
			name:            "Break even",
			currentValue:    6000000,
			totalCost:       6000000,
			expectedPNL:     0,
			expectedPercent: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pnl := CalculateUnrealizedPNL(tt.currentValue, tt.totalCost)
			if pnl != tt.expectedPNL {
				t.Errorf("CalculateUnrealizedPNL() = %d, want %d", pnl, tt.expectedPNL)
			}

			percent := CalculateUnrealizedPNLPercent(pnl, tt.totalCost)
			// Use floating point comparison with tolerance
			if diff := percent - tt.expectedPercent; diff > 0.0001 || diff < -0.0001 {
				t.Errorf("CalculateUnrealizedPNLPercent() = %f, want %f (diff: %f)", percent, tt.expectedPercent, diff)
			}
		})
	}
}

func TestCalculateRealizedPNL(t *testing.T) {
	tests := []struct {
		name        string
		costBasis   int64
		sellValue   int64
		expectedPNL int64
	}{
		{
			name:        "Profit: sold for $70K, bought for $60K",
			costBasis:   6000000,
			sellValue:   7000000,
			expectedPNL: 1000000,
		},
		{
			name:        "Loss: sold for $50K, bought for $60K",
			costBasis:   6000000,
			sellValue:   5000000,
			expectedPNL: -1000000,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pnl := CalculateRealizedPNL(tt.costBasis, tt.sellValue)
			if pnl != tt.expectedPNL {
				t.Errorf("CalculateRealizedPNL() = %d, want %d", pnl, tt.expectedPNL)
			}
		})
	}
}
