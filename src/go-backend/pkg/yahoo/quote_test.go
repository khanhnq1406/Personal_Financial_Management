package yahoo

import (
	"context"
	"net/url"
	"strings"
	"testing"
)

func TestBuildQuoteURL(t *testing.T) {
	tests := []struct {
		name           string
		symbol         string
		expectedSymbol string
		hasFields      bool
	}{
		{
			name:           "Valid symbol AAPL",
			symbol:         "AAPL",
			expectedSymbol: "AAPL",
			hasFields:      true,
		},
		{
			name:           "Vietnamese stock VCB.VN",
			symbol:         "VCB.VN",
			expectedSymbol: "VCB.VN",
			hasFields:      true,
		},
		{
			name:           "Crypto BTC-USD",
			symbol:         "BTC-USD",
			expectedSymbol: "BTC-USD",
			hasFields:      true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			urlStr := buildQuoteURL(tt.symbol)

			// Parse URL to verify components
			parsedURL, err := url.Parse(urlStr)
			if err != nil {
				t.Fatalf("Failed to parse URL: %v", err)
			}

			// Check base URL
			if parsedURL.Host != "query2.finance.yahoo.com" {
				t.Errorf("Host = %s, want query2.finance.yahoo.com", parsedURL.Host)
			}
			if parsedURL.Path != "/v7/finance/quote" {
				t.Errorf("Path = %s, want /v7/finance/quote", parsedURL.Path)
			}

			// Check symbols parameter
			symbols := parsedURL.Query().Get("symbols")
			if symbols != tt.expectedSymbol {
				t.Errorf("symbols = %s, want %s", symbols, tt.expectedSymbol)
			}

			// Check fields parameter
			fields := parsedURL.Query().Get("fields")
			if tt.hasFields && fields == "" {
				t.Error("fields parameter should not be empty")
			}
			if tt.hasFields && !strings.Contains(fields, "regularMarketPrice") {
				t.Error("fields should contain regularMarketPrice")
			}
			if tt.hasFields && !strings.Contains(fields, "regularMarketChange") {
				t.Error("fields should contain regularMarketChange")
			}

			// Check other parameters
			formatted := parsedURL.Query().Get("formatted")
			if formatted != "false" {
				t.Errorf("formatted = %s, want false", formatted)
			}

			region := parsedURL.Query().Get("region")
			if region != "US" {
				t.Errorf("region = %s, want US", region)
			}

			lang := parsedURL.Query().Get("lang")
			if lang != "en-US" {
				t.Errorf("lang = %s, want en-US", lang)
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

func TestToSmallestCurrencyUnit(t *testing.T) {
	tests := []struct {
		name       string
		price      float64
		priceHint  int
		expected   int64
	}{
		{
			name:      "USD price $150.25 with 2 decimals",
			price:     150.25,
			priceHint: 2,
			expected:  15025,
		},
		{
			name:      "VND price 69600 with 2 decimals",
			price:     69600.00,
			priceHint: 2,
			expected:  6960000,
		},
		{
			name:      "Whole number price 100 with 2 decimals",
			price:     100.00,
			priceHint: 2,
			expected:  10000,
		},
		{
			name:      "Price with 4 decimal places (crypto)",
			price:     1.2345,
			priceHint: 4,
			expected:  12345,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ToSmallestCurrencyUnit(tt.price, tt.priceHint)
			if result != tt.expected {
				t.Errorf("ToSmallestCurrencyUnit() = %d, want %d", result, tt.expected)
			}
		})
	}
}
