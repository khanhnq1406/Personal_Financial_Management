package currency

import (
	"context"
	"errors"
	"testing"

	"wealthjourney/pkg/fx"
)

// mockProvider is a mock implementation of fx.Provider for testing
type mockProvider struct {
	rates map[string]float64
}

// Compile-time interface implementation check
var _ fx.Provider = (*mockProvider)(nil)

func newMockProvider(rates map[string]float64) *mockProvider {
	return &mockProvider{rates: rates}
}

func (m *mockProvider) GetRate(ctx context.Context, fromCurrency, toCurrency string) (float64, error) {
	key := fromCurrency + ":" + toCurrency
	if rate, ok := m.rates[key]; ok {
		return rate, nil
	}
	if fromCurrency == toCurrency {
		return 1.0, nil
	}
	return 0, errors.New("rate not found")
}

func TestConverter_ConvertAmount(t *testing.T) {
	tests := []struct {
		name         string
		amount       int64
		fromCurrency string
		toCurrency   string
		rate         float64
		want         int64
		wantErr      bool
	}{
		// Basic conversions (now accounting for decimal places)
		// USD (2 decimals) to VND (0 decimals): 100 cents = $1 -> $1 * 25000 = 25000 VND
		{"USD to VND", 100, "USD", "VND", 25000, 25000, false},
		// VND (0 decimals) to USD (2 decimals): 25000 VND * 0.00004 = $1 = 100 cents
		{"VND to USD", 25000, "VND", "USD", 0.00004, 100, false},
		// EUR (2 decimals) to USD (2 decimals): 1000 cents = €10 -> $11 = 1100 cents
		{"EUR to USD", 1000, "EUR", "USD", 1.1, 1100, false},

		// Same currency (no conversion)
		{"USD to USD", 5000, "USD", "USD", 1.0, 5000, false},
		{"VND to VND", 10000, "VND", "VND", 1.0, 10000, false},

		// Zero amounts
		{"zero amount", 0, "USD", "VND", 25000, 0, false},

		// Large amounts: 100000000 cents = $1,000,000 -> 1,000,000 * 25000 = 25,000,000,000 VND
		{"large amount", 100000000, "USD", "VND", 25000, 25000000000, false},

		// Fractional conversions: 3 cents = $0.03 -> 0.03 * 25000 = 750 VND
		{"fractional conversion", 3, "USD", "VND", 25000, 750, false},

		// Edge cases
		// 1000000 VND * 0.00004 = $40 = 4000 cents
		{"very small rate", 1000000, "VND", "USD", 0.00004, 4000, false},
		// JPY (0 decimals) to VND (0 decimals): 1 JPY * 180 = 180 VND
		{"very large rate", 1, "JPY", "VND", 180, 180, false},

		// Errors
		{"rate not found", 100, "USD", "XXX", 0, 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup mock provider
			rates := map[string]float64{
				"USD:VND": tt.rate,
				"VND:USD": tt.rate,
				"EUR:USD": tt.rate,
				"JPY:VND": tt.rate,
			}
			provider := newMockProvider(rates)
			converter := NewConverter(provider)

			// Perform conversion
			got, err := converter.ConvertAmount(context.Background(), tt.amount, tt.fromCurrency, tt.toCurrency)

			// Check results
			if (err != nil) != tt.wantErr {
				t.Errorf("ConvertAmount() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && got != tt.want {
				t.Errorf("ConvertAmount() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestConverter_ConvertAmountWithRate(t *testing.T) {
	// Note: ConvertAmountWithRate is DEPRECATED and doesn't account for decimal places
	// These tests verify the legacy behavior (simple multiplication)
	tests := []struct {
		name   string
		amount int64
		rate   float64
		want   int64
	}{
		// Basic conversions (legacy behavior - no decimal adjustment)
		{"simple multiply", 100, 25000, 2500000},
		{"small rate", 2500000, 0.00004, 100},
		{"rate > 1", 1000, 1.1, 1100},

		// Edge cases
		{"zero amount", 0, 25000, 0},
		{"zero rate", 100, 0, 0},
		{"rate of 1", 5000, 1.0, 5000},

		// Large amounts
		{"large amount", 100000000, 25000, 2500000000000},

		// Fractional conversions
		{"fractional conversion", 3, 25000, 75000},
		{"fractional rate", 100, 1.5, 150},
		{"very small rate", 1000000, 0.00004, 40},

		// Precision tests
		{"high precision rate", 100, 25123.456789, 2512345}, // Loses decimal places
		{"rounding down", 100, 1.234, 123},
		{"rounding up", 100, 1.789, 178},
	}

	converter := NewConverter(nil) // Provider not needed for ConvertAmountWithRate

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := converter.ConvertAmountWithRate(tt.amount, tt.rate); got != tt.want {
				t.Errorf("ConvertAmountWithRate() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestConverter_ConvertAmountWithRateAndCurrencies(t *testing.T) {
	tests := []struct {
		name         string
		amount       int64
		rate         float64
		fromCurrency string
		toCurrency   string
		want         int64
	}{
		// USD (2 decimals) to VND (0 decimals)
		// 100 cents = $1, $1 * 25000 = 25000 VND
		{"USD to VND", 100, 25000, "USD", "VND", 25000},
		// 42 cents = $0.42, $0.42 * 25850 = 10857 VND
		{"42 cents to VND", 42, 25850, "USD", "VND", 10857},

		// VND (0 decimals) to USD (2 decimals)
		// 25000 VND * 0.00004 = $1 = 100 cents
		{"VND to USD", 25000, 0.00004, "VND", "USD", 100},
		// 10857 VND * 0.0000387 = $0.42 = 42 cents
		{"VND to USD cents", 10857, 0.0000387, "VND", "USD", 42},

		// Same decimal currencies
		// 1000 EUR cents = €10, €10 * 1.1 = $11 = 1100 cents
		{"EUR to USD", 1000, 1.1, "EUR", "USD", 1100},

		// Zero decimals to zero decimals
		// 100 JPY * 180 = 18000 VND
		{"JPY to VND", 100, 180, "JPY", "VND", 18000},

		// Edge cases
		{"zero amount", 0, 25000, "USD", "VND", 0},
	}

	converter := NewConverter(nil)

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := converter.ConvertAmountWithRateAndCurrencies(tt.amount, tt.rate, tt.fromCurrency, tt.toCurrency)
			if got != tt.want {
				t.Errorf("ConvertAmountWithRateAndCurrencies() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestConverter_ConvertBatch(t *testing.T) {
	tests := []struct {
		name         string
		amounts      []int64
		fromCurrency string
		toCurrency   string
		rate         float64
		want         []int64
		wantErr      bool
	}{
		// Basic batch conversion (now accounting for decimal places)
		// USD (2 decimals) to VND (0 decimals)
		// 100 cents = $1 -> 25000 VND, 200 cents = $2 -> 50000 VND, etc.
		{
			name:         "USD to VND batch",
			amounts:      []int64{100, 200, 300},
			fromCurrency: "USD",
			toCurrency:   "VND",
			rate:         25000,
			want:         []int64{25000, 50000, 75000},
			wantErr:      false,
		},

		// Same currency (no conversion)
		{
			name:         "USD to USD batch",
			amounts:      []int64{100, 200, 300},
			fromCurrency: "USD",
			toCurrency:   "USD",
			rate:         1.0,
			want:         []int64{100, 200, 300},
			wantErr:      false,
		},

		// Empty batch
		{
			name:         "empty batch",
			amounts:      []int64{},
			fromCurrency: "USD",
			toCurrency:   "VND",
			rate:         25000,
			want:         []int64{},
			wantErr:      false,
		},

		// Single item batch: 100 cents = $1 -> 25000 VND
		{
			name:         "single item",
			amounts:      []int64{100},
			fromCurrency: "USD",
			toCurrency:   "VND",
			rate:         25000,
			want:         []int64{25000},
			wantErr:      false,
		},

		// Zero amounts: 100 cents = $1 -> 25000 VND, 200 cents = $2 -> 50000 VND
		{
			name:         "with zeros",
			amounts:      []int64{0, 100, 0, 200},
			fromCurrency: "USD",
			toCurrency:   "VND",
			rate:         25000,
			want:         []int64{0, 25000, 0, 50000},
			wantErr:      false,
		},

		// Error case
		{
			name:         "rate not found",
			amounts:      []int64{100, 200},
			fromCurrency: "USD",
			toCurrency:   "XXX",
			rate:         0,
			want:         nil,
			wantErr:      true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup mock provider
			rates := map[string]float64{
				"USD:VND": tt.rate,
			}
			provider := newMockProvider(rates)
			converter := NewConverter(provider)

			// Perform batch conversion
			got, err := converter.ConvertBatch(context.Background(), tt.amounts, tt.fromCurrency, tt.toCurrency)

			// Check results
			if (err != nil) != tt.wantErr {
				t.Errorf("ConvertBatch() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr {
				if len(got) != len(tt.want) {
					t.Errorf("ConvertBatch() length = %v, want %v", len(got), len(tt.want))
					return
				}
				for i := range got {
					if got[i] != tt.want[i] {
						t.Errorf("ConvertBatch()[%d] = %v, want %v", i, got[i], tt.want[i])
					}
				}
			}
		})
	}
}

func TestConverter_ConvertAmount_EdgeCases(t *testing.T) {
	tests := []struct {
		name         string
		amount       int64
		fromCurrency string
		toCurrency   string
		rate         float64
		want         int64
	}{
		// Large values (but not overflowing)
		// 1000000000 cents = $10,000,000 -> $10M * 25000 = 250,000,000,000 VND
		{"large amount", 1000000000, "USD", "VND", 25000, 250000000000},

		// Negative amounts (should work mathematically, though maybe not business logic)
		// -100 cents = -$1 -> -25000 VND
		{"negative amount", -100, "USD", "VND", 25000, -25000},

		// Very small fractional conversions
		// 1 VND * 0.00004 = 0.00004 USD = 0.004 cents -> rounds to 0
		{"small to large currency", 1, "VND", "USD", 0.00004, 0},
		// 1 cent = $0.01 -> 0.01 * 25000 = 250 VND
		{"large to small currency", 1, "USD", "VND", 25000, 250},

		// Rate precision
		// 10000 cents = $100 -> $100 * 25123.456789 = 2,512,345.6789 VND -> 2512346 VND
		{"high precision rate", 10000, "USD", "VND", 25123.456789, 2512346},
		// 1000 EUR cents = €10 -> $11.23456789 = 1123.456789 cents -> 1123 cents
		{"very high precision rate", 1000, "EUR", "USD", 1.123456789, 1123},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rates := map[string]float64{
				"USD:VND": tt.rate,
				"VND:USD": tt.rate,
				"EUR:USD": tt.rate,
			}
			provider := newMockProvider(rates)
			converter := NewConverter(provider)

			got, err := converter.ConvertAmount(context.Background(), tt.amount, tt.fromCurrency, tt.toCurrency)
			if err != nil {
				t.Fatalf("ConvertAmount() unexpected error: %v", err)
			}

			if got != tt.want {
				t.Errorf("ConvertAmount() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestConverter_ConvertAmount_Validation(t *testing.T) {
	// Test that invalid FX rates are rejected
	tests := []struct {
		name         string
		amount       int64
		fromCurrency string
		toCurrency   string
		rate         float64
		wantErr      bool
	}{
		{"negative rate", 100, "USD", "VND", -25000, true},
		{"zero rate (different currencies)", 100, "USD", "VND", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a provider that returns invalid rates
			provider := newMockProvider(map[string]float64{
				"USD:VND": tt.rate,
			})
			converter := NewConverter(provider)

			_, err := converter.ConvertAmount(context.Background(), tt.amount, tt.fromCurrency, tt.toCurrency)

			if (err != nil) != tt.wantErr {
				t.Errorf("ConvertAmount() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestConverter_ConvertAmount_PrecisionLoss(t *testing.T) {
	// Test cases where precision loss is expected
	// VND (0 decimals) to USD (2 decimals): amount * rate * 100
	tests := []struct {
		name         string
		amount       int64
		fromCurrency string
		toCurrency   string
		rate         float64
		want         int64
	}{
		// VND to USD (now accounts for decimal places)
		// 25001 VND * 0.00004 * 100 = 100.004 cents -> 100 cents
		{"VND to USD - rounds down", 25001, "VND", "USD", 0.00004, 100},
		// 24999 VND * 0.00004 * 100 = 99.996 cents -> 100 cents (rounds)
		{"VND to USD - rounds to 100", 24999, "VND", "USD", 0.00004, 100},

		// Fractional amounts
		// 1 VND * 0.00004 * 100 = 0.004 cents -> 0 cents
		{"fractional VND", 1, "VND", "USD", 0.00004, 0},
		// 10000 VND * 0.00004 * 100 = 40 cents
		{"fractional VND large", 10000, "VND", "USD", 0.00004, 40},
		// 12500 VND * 0.00004 * 100 = 50 cents
		{"fractional VND threshold", 12500, "VND", "USD", 0.00004, 50},
		// 12501 VND * 0.00004 * 100 = 50.004 cents -> 50 cents
		{"fractional VND crosses threshold", 12501, "VND", "USD", 0.00004, 50},
		// 25000 VND * 0.00004 * 100 = 100 cents = $1
		{"VND to USD - 1 dollar", 25000, "VND", "USD", 0.00004, 100},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rates := map[string]float64{
				"VND:USD": tt.rate,
			}
			provider := newMockProvider(rates)
			converter := NewConverter(provider)

			got, err := converter.ConvertAmount(context.Background(), tt.amount, tt.fromCurrency, tt.toCurrency)
			if err != nil {
				t.Fatalf("ConvertAmount() unexpected error: %v", err)
			}

			if got != tt.want {
				t.Errorf("ConvertAmount() = %v, want %v", got, tt.want)
			}
		})
	}
}
