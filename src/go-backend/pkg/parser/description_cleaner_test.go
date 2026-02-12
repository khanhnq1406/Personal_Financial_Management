package parser

import (
	"testing"
)

func TestDescriptionCleaner_Clean(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		// Bank prefix removal
		{
			name:  "Remove PURCHASE AT prefix",
			input: "PURCHASE AT STARBUCKS HANOI",
			want:  "Starbucks",
		},
		{
			name:  "Remove PAYMENT TO prefix",
			input: "PAYMENT TO AMAZON.COM",
			want:  "Amazon", // Merchant extraction removes .COM
		},
		{
			name:  "Remove POS prefix",
			input: "POS PURCHASE GRAB VIETNAM",
			want:  "Grab", // "VIETNAM" is treated as location keyword
		},
		{
			name:  "Remove ATM prefix",
			input: "ATM WITHDRAWAL VIETCOMBANK",
			want:  "Vietcombank",
		},
		{
			name:  "Vietnamese prefix - MUA HÀNG TẠI",
			input: "MUA HÀNG TẠI CIRCLE K HANOI",
			want:  "Circle K",
		},
		{
			name:  "Vietnamese prefix - THANH TOÁN TẠI",
			input: "THANH TOÁN TẠI VINMART",
			want:  "Vinmart",
		},

		// Transaction code removal
		{
			name:  "Remove REF code",
			input: "STARBUCKS HANOI REF:123456789",
			want:  "Starbucks",
		},
		{
			name:  "Remove TRACE code",
			input: "AMAZON.COM TRACE#:987654321",
			want:  "Amazon", // .COM is removed by merchant extraction
		},
		{
			name:  "Remove AUTH code",
			input: "GRAB AUTH:ABCD1234",
			want:  "Grab",
		},
		{
			name:  "Remove multiple codes",
			input: "SHOPEE REF:123 AUTH:ABC TXN:789",
			want:  "Shopee",
		},

		// Long number stripping
		{
			name:  "Remove card number",
			input: "PURCHASE AT STORE 1234567890123456",
			want:  "Store",
		},
		{
			name:  "Remove masked card",
			input: "PAYMENT **** **** **** 1234",
			want:  "Payment",
		},
		{
			name:  "Keep short numbers",
			input: "STORE 123",
			want:  "Store 123",
		},

		// Merchant extraction
		{
			name:  "Extract merchant from location",
			input: "STARBUCKS HANOI VN",
			want:  "Starbucks",
		},
		{
			name:  "Extract merchant from city",
			input: "CIRCLE K HO CHI MINH",
			want:  "Circle K",
		},
		{
			name:  "Extract merchant from Saigon",
			input: "HIGHLAND COFFEE SAIGON",
			want:  "Highland Coffee",
		},

		// Whitespace normalization
		{
			name:  "Multiple spaces",
			input: "STARBUCKS    HANOI",
			want:  "Starbucks",
		},
		{
			name:  "Leading/trailing spaces",
			input: "  GRAB VIETNAM  ",
			want:  "Grab", // "VIETNAM" is treated as location keyword
		},
		{
			name:  "Tabs and newlines",
			input: "AMAZON\t\nCOM",
			want:  "Amazon Com",
		},

		// Capitalization
		{
			name:  "All uppercase to title case",
			input: "HIGHLAND COFFEE",
			want:  "Highland Coffee",
		},
		{
			name:  "All lowercase to title case",
			input: "amazon prime video",
			want:  "Amazon Prime Video",
		},
		{
			name:  "Mixed case preserved",
			input: "McDonald's",
			want:  "McDonald's",
		},
		{
			name:  "Title case with articles",
			input: "PAYMENT TO THE COFFEE HOUSE",
			want:  "The Coffee House",
		},

		// Vietnamese diacritics
		{
			name:  "Vietnamese text preserved",
			input: "MUA HÀNG TẠI PHỐ XƯA",
			want:  "Phố Xưa",
		},
		{
			name:  "Vietnamese with caps",
			input: "CIRCLE K HCM",
			want:  "Circle K Hcm", // Keep non-location words
		},

		// Complex real-world examples
		{
			name:  "Techcombank statement",
			input: "POS PURCHASE CIRCLE K HANOI REF:123456789 AUTH:ABC123",
			want:  "Circle K",
		},
		{
			name:  "VCB credit card",
			input: "PAYMENT TO GRAB VIETNAM HO CHI MINH VN 1234567890",
			want:  "Grab", // Location extracted, long number stripped
		},
		{
			name:  "Online payment",
			input: "ONLINE PAYMENT SHOPEE.VN TRACE#:987654",
			want:  "Shopee", // .VN is removed
		},

		// Edge cases
		{
			name:  "Empty string",
			input: "",
			want:  "Imported Transaction",
		},
		{
			name:  "Only spaces",
			input: "   ",
			want:  "Imported Transaction",
		},
		{
			name:  "Only codes",
			input: "REF:123 AUTH:ABC",
			want:  "Imported Transaction",
		},
		{
			name:  "Short description",
			input: "OK",
			want:  "Ok",
		},
	}

	cleaner := NewDescriptionCleaner()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := cleaner.Clean(tt.input)
			if got != tt.want {
				t.Errorf("Clean() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestDescriptionCleaner_RemoveBankPrefixes(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"PURCHASE AT STARBUCKS", "STARBUCKS"},
		{"PAYMENT TO AMAZON", "AMAZON"},
		{"POS STARBUCKS", "STARBUCKS"},
		{"ATM WITHDRAWAL VIETCOMBANK", "VIETCOMBANK"},
		{"MUA HÀNG TẠI CIRCLE K", "CIRCLE K"},
		{"THANH TOÁN TẠI GRAB", "GRAB"},
		{"NO PREFIX HERE", "NO PREFIX HERE"},
	}

	cleaner := NewDescriptionCleaner()

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := cleaner.removeBankPrefixes(tt.input)
			if got != tt.want {
				t.Errorf("removeBankPrefixes() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestDescriptionCleaner_RemoveTransactionCodes(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"STARBUCKS REF:123456", "STARBUCKS"},
		{"AMAZON TRACE#:ABC123", "AMAZON"},
		{"GRAB AUTH:XYZ789", "GRAB"},
		{"SHOPEE TXN:111222", "SHOPEE"},
		{"STORE REF:123 AUTH:ABC", "STORE"},
		{"NO CODES HERE", "NO CODES HERE"},
	}

	cleaner := NewDescriptionCleaner()

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := cleaner.removeTransactionCodesFromDesc(tt.input)
			if got != tt.want {
				t.Errorf("removeTransactionCodesFromDesc() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestDescriptionCleaner_StripLongNumbers(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"STORE 1234567890123456", "STORE"},
		{"PAYMENT **** **** **** 1234", "PAYMENT"},
		{"STORE 123", "STORE 123"}, // Short number preserved
		{"NUMBER 12345678901", "NUMBER"},
		{"NO NUMBERS HERE", "NO NUMBERS HERE"},
	}

	cleaner := NewDescriptionCleaner()

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := cleaner.stripLongNumbers(tt.input)
			if got != tt.want {
				t.Errorf("stripLongNumbers() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestDescriptionCleaner_ExtractMerchant(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"STARBUCKS HANOI VN", "STARBUCKS"},
		{"CIRCLE K HO CHI MINH", "CIRCLE K"},
		{"GRAB SAIGON", "GRAB"},
		{"AMAZON DA NANG", "AMAZON"},
		{"SHORT", "SHORT"}, // Too short to extract
	}

	cleaner := NewDescriptionCleaner()

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := cleaner.extractMerchant(tt.input)
			if got != tt.want {
				t.Errorf("extractMerchant() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestDescriptionCleaner_Capitalization(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{"All caps", "STARBUCKS COFFEE", "Starbucks Coffee"},
		{"All lowercase", "amazon prime", "Amazon Prime"},
		{"Mixed case preserved", "McDonald's", "McDonald's"},
		{"With articles", "THE COFFEE HOUSE", "The Coffee House"},
		{"Multiple words", "PAYMENT TO THE STORE", "Payment to the Store"},
	}

	cleaner := NewDescriptionCleaner()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := cleaner.applyProperCapitalization(tt.input)
			if got != tt.want {
				t.Errorf("applyProperCapitalization() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestCleanDescription(t *testing.T) {
	// Test convenience function
	result := CleanDescription("PURCHASE AT STARBUCKS HANOI REF:123456")
	expected := "Starbucks"
	if result != expected {
		t.Errorf("CleanDescription() = %q, want %q", result, expected)
	}
}
