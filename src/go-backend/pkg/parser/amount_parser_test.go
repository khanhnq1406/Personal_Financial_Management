package parser

import (
	"testing"
)

func TestAmountParser_Parse_USFormat(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		want      int64
		wantError bool
	}{
		{
			name:      "Simple integer",
			input:     "1000",
			want:      10000000, // 1000 × 10000
			wantError: false,
		},
		{
			name:      "Decimal amount",
			input:     "1000.50",
			want:      10005000, // 1000.50 × 10000
			wantError: false,
		},
		{
			name:      "With thousands separator",
			input:     "1,234.56",
			want:      12345600, // 1234.56 × 10000
			wantError: false,
		},
		{
			name:      "Multiple thousands separators",
			input:     "1,234,567.89",
			want:      12345678900, // 1234567.89 × 10000
			wantError: false,
		},
		{
			name:      "With dollar sign",
			input:     "$1,234.56",
			want:      12345600,
			wantError: false,
		},
		{
			name:      "Four decimal places",
			input:     "100.1234",
			want:      1001234, // 100.1234 × 10000
			wantError: false,
		},
		{
			name:      "Negative with prefix",
			input:     "-1,234.56",
			want:      -12345600,
			wantError: false,
		},
		{
			name:      "Negative with suffix",
			input:     "1,234.56-",
			want:      -12345600,
			wantError: false,
		},
		{
			name:      "Negative with parentheses",
			input:     "(1,234.56)",
			want:      -12345600,
			wantError: false,
		},
		{
			name:      "Positive with prefix",
			input:     "+1,234.56",
			want:      12345600,
			wantError: false,
		},
	}

	format := &AmountFormat{
		DecimalSeparator:   ".",
		ThousandsSeparator: ",",
	}
	parser := NewAmountParser(format)

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parser.Parse(tt.input)

			if tt.wantError {
				if err == nil {
					t.Errorf("Parse() error = nil, wantError = true")
				}
				return
			}

			if err != nil {
				t.Errorf("Parse() error = %v, wantError = false", err)
				return
			}

			if got != tt.want {
				t.Errorf("Parse() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestAmountParser_Parse_EuropeanFormat(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		want      int64
		wantError bool
	}{
		{
			name:      "Simple integer",
			input:     "1000",
			want:      10000000, // 1000 × 10000
			wantError: false,
		},
		{
			name:      "Decimal amount",
			input:     "1000,50",
			want:      10005000, // 1000.50 × 10000
			wantError: false,
		},
		{
			name:      "With thousands separator",
			input:     "1.234,56",
			want:      12345600, // 1234.56 × 10000
			wantError: false,
		},
		{
			name:      "Multiple thousands separators",
			input:     "1.234.567,89",
			want:      12345678900, // 1234567.89 × 10000
			wantError: false,
		},
		{
			name:      "Techcombank format",
			input:     "2.500,75",
			want:      25007500, // 2500.75 × 10000
			wantError: false,
		},
		{
			name:      "With Euro symbol",
			input:     "€1.234,56",
			want:      12345600,
			wantError: false,
		},
		{
			name:      "With VND symbol",
			input:     "₫1.234.567,89",
			want:      12345678900,
			wantError: false,
		},
		{
			name:      "Negative with prefix",
			input:     "-1.234,56",
			want:      -12345600,
			wantError: false,
		},
		{
			name:      "Negative with parentheses",
			input:     "(1.234,56)",
			want:      -12345600,
			wantError: false,
		},
		{
			name:      "Large amount",
			input:     "10.000.000,00",
			want:      100000000000, // 10000000 × 10000
			wantError: false,
		},
	}

	format := &AmountFormat{
		DecimalSeparator:   ",",
		ThousandsSeparator: ".",
	}
	parser := NewAmountParser(format)

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parser.Parse(tt.input)

			if tt.wantError {
				if err == nil {
					t.Errorf("Parse() error = nil, wantError = true")
				}
				return
			}

			if err != nil {
				t.Errorf("Parse() error = %v, wantError = false", err)
				return
			}

			if got != tt.want {
				t.Errorf("Parse() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestAmountParser_AutoDetect(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		want      int64
		wantError bool
	}{
		// US format detection
		{
			name:      "US format - clear",
			input:     "1,234.56",
			want:      12345600,
			wantError: false,
		},
		{
			name:      "US format - multiple thousands",
			input:     "1,234,567.89",
			want:      12345678900,
			wantError: false,
		},
		// European format detection
		{
			name:      "European format - clear",
			input:     "1.234,56",
			want:      12345600,
			wantError: false,
		},
		{
			name:      "European format - Techcombank",
			input:     "2.500,75",
			want:      25007500,
			wantError: false,
		},
		{
			name:      "European format - multiple thousands",
			input:     "1.234.567,89",
			want:      12345678900,
			wantError: false,
		},
		// Ambiguous cases - should handle reasonably
		{
			name:      "Only comma - likely decimal",
			input:     "100,50",
			want:      1005000,
			wantError: false,
		},
		{
			name:      "Only comma - thousands separator",
			input:     "1,000",
			want:      10000000,
			wantError: false,
		},
		{
			name:      "Only dot - likely decimal",
			input:     "100.50",
			want:      1005000,
			wantError: false,
		},
		{
			name:      "Only dot - thousands separator",
			input:     "1.000",
			want:      10000000,
			wantError: false,
		},
		// No separators
		{
			name:      "Integer only",
			input:     "1000",
			want:      10000000,
			wantError: false,
		},
		// Currency symbols
		{
			name:      "VND symbol with European format",
			input:     "₫1.234.567,89",
			want:      12345678900,
			wantError: false,
		},
		{
			name:      "Dollar with US format",
			input:     "$1,234.56",
			want:      12345600,
			wantError: false,
		},
		// Negative amounts
		{
			name:      "Negative US format",
			input:     "-1,234.56",
			want:      -12345600,
			wantError: false,
		},
		{
			name:      "Negative European format",
			input:     "-1.234,56",
			want:      -12345600,
			wantError: false,
		},
		{
			name:      "Parentheses negative",
			input:     "(1,234.56)",
			want:      -12345600,
			wantError: false,
		},
		// Space as thousands separator
		{
			name:      "Space separator - French format",
			input:     "1 234,56",
			want:      12345600,
			wantError: false,
		},
	}

	parser := NewAmountParserWithAutoDetect()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parser.Parse(tt.input)

			if tt.wantError {
				if err == nil {
					t.Errorf("Parse() error = nil, wantError = true")
				}
				return
			}

			if err != nil {
				t.Errorf("Parse() error = %v, wantError = false", err)
				return
			}

			if got != tt.want {
				t.Errorf("Parse() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestAmountParser_CurrencySymbols(t *testing.T) {
	tests := []struct {
		name   string
		input  string
		want   int64
	}{
		{"VND dong", "₫1,234.56", 12345600},
		{"VND d", "đ1,234.56", 12345600},
		{"VND text", "VND1,234.56", 12345600},
		{"USD symbol", "$1,234.56", 12345600},
		{"USD text", "USD1,234.56", 12345600},
		{"EUR symbol", "€1,234.56", 12345600},
		{"EUR text", "EUR1,234.56", 12345600},
		{"GBP", "£1,234.56", 12345600},
		{"JPY", "¥1,234.56", 12345600},
		{"THB", "฿1,234.56", 12345600},
	}

	parser := NewAmountParserWithAutoDetect()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parser.Parse(tt.input)
			if err != nil {
				t.Errorf("Parse() error = %v", err)
				return
			}
			if got != tt.want {
				t.Errorf("Parse() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestAmountParser_NegativeFormats(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  int64
	}{
		{"Prefix minus", "-1234.56", -12345600},
		{"Suffix minus", "1234.56-", -12345600},
		{"Parentheses", "(1234.56)", -12345600},
		{"Parentheses with separators", "(1,234.56)", -12345600},
		{"Positive prefix", "+1234.56", 12345600},
		{"No sign", "1234.56", 12345600},
	}

	parser := NewAmountParserWithAutoDetect()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parser.Parse(tt.input)
			if err != nil {
				t.Errorf("Parse() error = %v", err)
				return
			}
			if got != tt.want {
				t.Errorf("Parse() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestAmountParser_ErrorCases(t *testing.T) {
	tests := []struct {
		name  string
		input string
	}{
		{"Empty string", ""},
		{"Only currency symbol", "$"},
		{"Letters", "abc"},
		{"Mixed invalid", "12abc34"},
	}

	parser := NewAmountParserWithAutoDetect()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := parser.Parse(tt.input)
			if err == nil {
				t.Errorf("Parse() expected error for input %q, got nil", tt.input)
			}
		})
	}
}

func TestParseWithFormat(t *testing.T) {
	// Test convenience function
	amount, err := ParseWithFormat("1.234,56", ",", ".")
	if err != nil {
		t.Errorf("ParseWithFormat() error = %v", err)
	}
	if amount != 12345600 {
		t.Errorf("ParseWithFormat() = %v, want 12345600", amount)
	}
}

func TestParseWithAutoDetect(t *testing.T) {
	// Test convenience function
	amount, err := ParseWithAutoDetect("1,234.56")
	if err != nil {
		t.Errorf("ParseWithAutoDetect() error = %v", err)
	}
	if amount != 12345600 {
		t.Errorf("ParseWithAutoDetect() = %v, want 12345600", amount)
	}
}
