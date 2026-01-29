package fx

import (
	"testing"
)

func TestValidateCurrency(t *testing.T) {
	tests := []struct {
		name      string
		currency  string
		wantErr   bool
		errString string
	}{
		// Major currencies
		{"USD is supported", "USD", false, ""},
		{"EUR is supported", "EUR", false, ""},
		{"GBP is supported", "GBP", false, ""},
		{"JPY is supported", "JPY", false, ""},

		// Asian currencies
		{"VND is supported", "VND", false, ""},
		{"CNY is supported", "CNY", false, ""},
		{"HKD is supported", "HKD", false, ""},
		{"SGD is supported", "SGD", false, ""},

		// Case insensitivity
		{"lowercase usd", "usd", false, ""},
		{"mixed case UsD", "UsD", false, ""},
		{"lowercase vnd", "vnd", false, ""},

		// Whitespace handling
		{"USD with spaces", " USD ", false, ""},

		// Unsupported currencies
		{"XXX is unsupported", "XXX", true, "unsupported currency: XXX"},
		{"ABC is unsupported", "ABC", true, "unsupported currency: ABC"},
		{"empty string", "", true, "unsupported currency: "},

		// Edge cases
		{"three letter unsupported", "XYZ", true, "unsupported currency: XYZ"},
		{"two letter code", "US", true, "unsupported currency: US"},
		{"four letter code", "USDD", true, "unsupported currency: USDD"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateCurrency(tt.currency)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateCurrency() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if tt.wantErr && err.Error() != tt.errString {
				t.Errorf("ValidateCurrency() error = %v, want %v", err.Error(), tt.errString)
			}
		})
	}
}

func TestIsSupportedCurrency(t *testing.T) {
	tests := []struct {
		name     string
		currency string
		want     bool
	}{
		{"USD is supported", "USD", true},
		{"EUR is supported", "EUR", true},
		{"VND is supported", "VND", true},
		{"XXX is unsupported", "XXX", false},
		{"empty string", "", false},
		{"lowercase usd", "usd", true}, // Case insensitive
		{"USD with spaces", " USD ", true}, // Trimmed
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsSupportedCurrency(tt.currency); got != tt.want {
				t.Errorf("IsSupportedCurrency() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestGetSupportedCurrencies(t *testing.T) {
	currencies := GetSupportedCurrencies()

	// Should not be empty
	if len(currencies) == 0 {
		t.Error("GetSupportedCurrencies() returned empty list")
	}

	// Should contain major currencies
	majorCurrencies := []string{"USD", "EUR", "GBP", "JPY", "VND"}
	for _, currency := range majorCurrencies {
		found := false
		for _, c := range currencies {
			if c == currency {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("GetSupportedCurrencies() missing major currency: %s", currency)
		}
	}
}

func TestValidateRate(t *testing.T) {
	tests := []struct {
		name         string
		fromCurrency string
		toCurrency   string
		rate         float64
		wantErr      bool
		errString    string
	}{
		// Valid rates for USD:VND
		{"USD to VND - mid range", "USD", "VND", 25000, false, ""},
		{"USD to VND - low range", "USD", "VND", 21000, false, ""},
		{"USD to VND - high range", "USD", "VND", 29000, false, ""},

		// Valid rates for VND:USD
		{"VND to USD - mid range", "VND", "USD", 0.00004, false, ""},
		{"VND to USD - low range", "VND", "USD", 0.000034, false, ""},
		{"VND to USD - high range", "VND", "USD", 0.000048, false, ""},

		// Valid rates for EUR:USD
		{"EUR to USD - mid range", "EUR", "USD", 1.1, false, ""},
		{"EUR to USD - low range", "EUR", "USD", 1.05, false, ""},
		{"EUR to USD - high range", "EUR", "USD", 1.25, false, ""},

		// Invalid rates - out of range
		{"USD to VND - too low", "USD", "VND", 15000, true, "out of range"},
		{"USD to VND - too high", "USD", "VND", 35000, true, "out of range"},
		{"VND to USD - too low", "VND", "USD", 0.00002, true, "out of range"},
		{"VND to USD - too high", "VND", "USD", 0.00006, true, "out of range"},

		// Invalid rates - negative or zero
		{"negative rate", "USD", "VND", -100, true, "must be positive"},
		{"zero rate", "USD", "VND", 0, true, "must be positive"},

		// Unknown currency pair (should not error, just skip validation)
		{"unknown pair - valid rate", "USD", "XYZ", 1.5, false, ""},
		{"unknown pair - negative rate", "USD", "XYZ", -1, true, "must be positive"},

		// Case insensitivity
		{"lowercase currencies", "usd", "vnd", 25000, false, ""},
		{"mixed case currencies", "UsD", "VnD", 25000, false, ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateRate(tt.fromCurrency, tt.toCurrency, tt.rate)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateRate() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if tt.wantErr && err != nil {
				// Check if error string contains expected substring
				if tt.errString != "" && !containsString(err.Error(), tt.errString) {
					t.Errorf("ValidateRate() error = %v, want string containing %q", err.Error(), tt.errString)
				}
			}
		})
	}
}

func TestValidateRate_EdgeCases(t *testing.T) {
	tests := []struct {
		name         string
		fromCurrency string
		toCurrency   string
		rate         float64
		wantErr      bool
	}{
		// Boundary values for USD:VND (20000-30000)
		{"USD:VND exact min", "USD", "VND", 20000, false},
		{"USD:VND exact max", "USD", "VND", 30000, false},
		{"USD:VND just below min", "USD", "VND", 19999.99, true},
		{"USD:VND just above max", "USD", "VND", 30000.01, true},

		// Very small rates
		{"very small valid rate", "VND", "USD", 0.000033, false},
		{"very small invalid rate", "VND", "USD", 0.000001, true},

		// Very large rates
		{"large valid rate", "JPY", "USD", 0.01, false},
		{"large invalid rate", "JPY", "USD", 1.0, true},

		// Decimal precision
		{"high precision rate", "USD", "VND", 25123.456789, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateRate(tt.fromCurrency, tt.toCurrency, tt.rate)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateRate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestNormalizeCurrency(t *testing.T) {
	tests := []struct {
		name     string
		currency string
		want     string
	}{
		{"already uppercase", "USD", "USD"},
		{"lowercase", "usd", "USD"},
		{"mixed case", "UsD", "USD"},
		{"with leading space", " USD", "USD"},
		{"with trailing space", "USD ", "USD"},
		{"with both spaces", " USD ", "USD"},
		{"three letter", "ABC", "ABC"},
		{"two letter", "US", "US"},
		{"four letter", "USDD", "USDD"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := normalizeCurrency(tt.currency); got != tt.want {
				t.Errorf("normalizeCurrency() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestGetDecimalPlaces(t *testing.T) {
	tests := []struct {
		name     string
		currency string
		want     int
	}{
		// 2 decimal place currencies
		{"USD has 2 decimals", "USD", 2},
		{"EUR has 2 decimals", "EUR", 2},
		{"GBP has 2 decimals", "GBP", 2},

		// 0 decimal place currencies
		{"VND has 0 decimals", "VND", 0},
		{"JPY has 0 decimals", "JPY", 0},
		{"KRW has 0 decimals", "KRW", 0},
		{"IDR has 0 decimals", "IDR", 0},

		// Case insensitivity
		{"lowercase usd", "usd", 2},
		{"lowercase vnd", "vnd", 0},

		// Unknown currency defaults to 2
		{"unknown currency", "XXX", 2},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := GetDecimalPlaces(tt.currency); got != tt.want {
				t.Errorf("GetDecimalPlaces() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestGetDecimalMultiplier(t *testing.T) {
	tests := []struct {
		name     string
		currency string
		want     int64
	}{
		// 2 decimal place currencies -> multiplier 100
		{"USD multiplier", "USD", 100},
		{"EUR multiplier", "EUR", 100},
		{"GBP multiplier", "GBP", 100},

		// 0 decimal place currencies -> multiplier 1
		{"VND multiplier", "VND", 1},
		{"JPY multiplier", "JPY", 1},
		{"KRW multiplier", "KRW", 1},

		// Unknown currency defaults to 100
		{"unknown currency", "XXX", 100},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := GetDecimalMultiplier(tt.currency); got != tt.want {
				t.Errorf("GetDecimalMultiplier() = %v, want %v", got, tt.want)
			}
		})
	}
}

// Helper function to check if a string contains a substring
func containsString(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 || indexOfSubstring(s, substr) >= 0)
}

func indexOfSubstring(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}
