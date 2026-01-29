package yahoo

import (
	"context"
	"net/url"
	"strings"
	"testing"
)

func TestBuildChartURL(t *testing.T) {
	tests := []struct {
		name           string
		symbol         string
		expectedSymbol string
	}{
		{
			name:           "Valid symbol AAPL",
			symbol:         "AAPL",
			expectedSymbol: "AAPL",
		},
		{
			name:           "Vietnamese stock VCB.VN",
			symbol:         "VCB.VN",
			expectedSymbol: "VCB.VN",
		},
		{
			name:           "Crypto BTC-USD",
			symbol:         "BTC-USD",
			expectedSymbol: "BTC-USD",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			urlStr := buildChartURL(tt.symbol)

			// Parse URL to verify components
			parsedURL, err := url.Parse(urlStr)
			if err != nil {
				t.Fatalf("Failed to parse URL: %v", err)
			}

			// Check base URL
			if parsedURL.Host != "query1.finance.yahoo.com" {
				t.Errorf("Host = %s, want query1.finance.yahoo.com", parsedURL.Host)
			}
			if !strings.HasPrefix(parsedURL.Path, "/v8/finance/chart/") {
				t.Errorf("Path = %s, want /v8/finance/chart/<symbol>", parsedURL.Path)
			}
			if !strings.HasSuffix(parsedURL.Path, tt.expectedSymbol) {
				t.Errorf("Path = %s, should end with %s", parsedURL.Path, tt.expectedSymbol)
			}

			// Check interval parameter
			interval := parsedURL.Query().Get("interval")
			if interval != "1d" {
				t.Errorf("interval = %s, want 1d", interval)
			}

			// Check range parameter
			rangeVal := parsedURL.Query().Get("range")
			if rangeVal != "1d" {
				t.Errorf("range = %s, want 1d", rangeVal)
			}
		})
	}
}

func TestGetQuote_ValidSymbol(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	ctx := context.Background()

	tests := []struct {
		name   string
		symbol string
	}{
		{
			name:   "Apple stock",
			symbol: "AAPL",
		},
		{
			name:   "Vietnamese stock VCB",
			symbol: "VCB.VN",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			quote, err := GetQuote(ctx, tt.symbol)
			if err != nil {
				t.Fatalf("GetQuote() error = %v", err)
			}

			// Verify required fields
			if quote.Symbol != tt.symbol {
				t.Errorf("Symbol = %s, want %s", quote.Symbol, tt.symbol)
			}

			if quote.RegularMarketPrice == 0 {
				t.Error("RegularMarketPrice should not be zero")
			}

			if quote.Currency == "" {
				t.Error("Currency should not be empty")
			}
		})
	}
}

func TestGetQuote_EmptySymbol(t *testing.T) {
	ctx := context.Background()
	_, err := GetQuote(ctx, "")
	if err == nil {
		t.Error("GetQuote() should return error for empty symbol")
	}
}

func TestGetQuote_InvalidSymbol(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	ctx := context.Background()
	_, err := GetQuote(ctx, "INVALIDSYMBOL123XYZ")
	if err == nil {
		t.Error("GetQuote() should return error for invalid symbol")
	}
	if err != ErrSymbolNotFound {
		t.Errorf("Expected ErrSymbolNotFound, got: %v", err)
	}
}

func TestGetQuoteBatch_ValidSymbols(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	ctx := context.Background()
	symbols := []string{"AAPL", "MSFT", "GOOGL"}

	results, err := GetQuoteBatch(ctx, symbols)
	if err != nil {
		t.Fatalf("GetQuoteBatch() error = %v", err)
	}

	// Verify we got results for all symbols
	for _, symbol := range symbols {
		quote, exists := results[symbol]
		if !exists {
			t.Errorf("Missing result for symbol %s", symbol)
			continue
		}

		if quote.Symbol != symbol {
			t.Errorf("Result symbol = %s, want %s", quote.Symbol, symbol)
		}

		if quote.RegularMarketPrice == 0 {
			t.Errorf("RegularMarketPrice should not be zero for %s", symbol)
		}
	}
}

func TestGetQuoteBatch_EmptyList(t *testing.T) {
	ctx := context.Background()
	_, err := GetQuoteBatch(ctx, []string{})
	if err == nil {
		t.Error("GetQuoteBatch() should return error for empty list")
	}
}

func TestGetQuoteBatch_OnlyEmptyStrings(t *testing.T) {
	ctx := context.Background()
	_, err := GetQuoteBatch(ctx, []string{"", "  ", ""})
	if err == nil {
		t.Error("GetQuoteBatch() should return error for list with only empty strings")
	}
}

func TestToSmallestCurrencyUnitByCurrency(t *testing.T) {
	tests := []struct {
		name     string
		price    float64
		currency string
		expected int64
	}{
		{
			name:     "USD price $150.25 with 2 decimals",
			price:    150.25,
			currency: "USD",
			expected: 15025,
		},
		{
			name:     "VND price 69800 with 0 decimals",
			price:    69800.00,
			currency: "VND",
			expected: 69800,
		},
		{
			name:     "JPY price 15000 with 0 decimals",
			price:    15000.00,
			currency: "JPY",
			expected: 15000,
		},
		{
			name:     "EUR price 100.50",
			price:    100.50,
			currency: "EUR",
			expected: 10050,
		},
		{
			name:     "KWD price with 3 decimals",
			price:    1.234,
			currency: "KWD",
			expected: 1234,
		},
		{
			name:     "Unknown currency defaults to 2 decimals",
			price:    100.25,
			currency: "XYZ",
			expected: 10025,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ToSmallestCurrencyUnitByCurrency(tt.price, tt.currency)
			if result != tt.expected {
				t.Errorf("ToSmallestCurrencyUnitByCurrency() = %d, want %d", result, tt.expected)
			}
		})
	}
}

func TestGetCurrencyDecimalPlaces(t *testing.T) {
	tests := []struct {
		currency string
		expected int
	}{
		{"VND", 0},
		{"JPY", 0},
		{"KRW", 0},
		{"USD", 2},
		{"EUR", 2},
		{"GBP", 2},
		{"KWD", 3},
		{"BHD", 3},
		{"XYZ", 2}, // Unknown defaults to 2
	}

	for _, tt := range tests {
		t.Run(tt.currency, func(t *testing.T) {
			result := GetCurrencyDecimalPlaces(tt.currency)
			if result != tt.expected {
				t.Errorf("GetCurrencyDecimalPlaces(%s) = %d, want %d", tt.currency, result, tt.expected)
			}
		})
	}
}
