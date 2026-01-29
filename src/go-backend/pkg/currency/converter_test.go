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
		// Basic conversions
		{"USD to VND", 100, "USD", "VND", 25000, 2500000, false},
		{"VND to USD", 2500000, "VND", "USD", 0.00004, 100, false},
		{"EUR to USD", 1000, "EUR", "USD", 1.1, 1100, false},

		// Same currency (no conversion)
		{"USD to USD", 5000, "USD", "USD", 1.0, 5000, false},
		{"VND to VND", 10000, "VND", "VND", 1.0, 10000, false},

		// Zero amounts
		{"zero amount", 0, "USD", "VND", 25000, 0, false},

		// Large amounts
		{"large amount", 100000000, "USD", "VND", 25000, 2500000000000, false},

		// Fractional conversions (loss of precision)
		{"fractional conversion", 3, "USD", "VND", 25000, 75000, false},

		// Edge cases
		{"very small rate", 1000000, "VND", "USD", 0.00004, 40, false},
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
	tests := []struct {
		name   string
		amount int64
		rate   float64
		want   int64
	}{
		// Basic conversions
		{"USD to VND", 100, 25000, 2500000},
		{"VND to USD", 2500000, 0.00004, 100},
		{"EUR to USD", 1000, 1.1, 1100},

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
		// Basic batch conversion
		{
			name:         "USD to VND batch",
			amounts:      []int64{100, 200, 300},
			fromCurrency: "USD",
			toCurrency:   "VND",
			rate:         25000,
			want:         []int64{2500000, 5000000, 7500000},
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

		// Single item batch
		{
			name:         "single item",
			amounts:      []int64{100},
			fromCurrency: "USD",
			toCurrency:   "VND",
			rate:         25000,
			want:         []int64{2500000},
			wantErr:      false,
		},

		// Zero amounts
		{
			name:         "with zeros",
			amounts:      []int64{0, 100, 0, 200},
			fromCurrency: "USD",
			toCurrency:   "VND",
			rate:         25000,
			want:         []int64{0, 2500000, 0, 5000000},
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
		{"large amount", 1000000000, "USD", "VND", 25000, 25000000000000},

		// Negative amounts (should work mathematically, though maybe not business logic)
		{"negative amount", -100, "USD", "VND", 25000, -2500000},

		// Very small fractional conversions
		{"small to large currency", 1, "VND", "USD", 0.00004, 0}, // Rounds to 0
		{"large to small currency", 1, "USD", "VND", 25000, 25000},

		// Rate precision
		{"high precision rate", 10000, "USD", "VND", 25123.456789, 251234567},
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
	tests := []struct {
		name         string
		amount       int64
		fromCurrency string
		toCurrency   string
		rate         float64
		want         int64
	}{
		// VND to USD (precision loss expected)
		// Using rate 0.00004 which is within valid range (0.000033-0.00005)
		{"VND to USD - rounds down", 25001, "VND", "USD", 0.00004, 1}, // 1.00004 -> 1
		{"VND to USD - rounds to 0", 24999, "VND", "USD", 0.00004, 0},  // 0.99996 -> 0 (truncates)

		// Fractional amounts
		{"fractional VND", 1, "VND", "USD", 0.00004, 0},                    // 0.00004 -> 0
		{"fractional VND large", 10000, "VND", "USD", 0.00004, 0},          // 0.4 -> 0
		{"fractional VND threshold", 12500, "VND", "USD", 0.00004, 0},      // 0.5 -> 0
		{"fractional VND crosses threshold", 12501, "VND", "USD", 0.00004, 0}, // 0.50004 -> 0 (truncates)
		{"VND to USD - 1 unit", 25000, "VND", "USD", 0.00004, 1},          // 1.0 -> 1
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
