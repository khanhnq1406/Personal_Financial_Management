package parser

import (
	"testing"
	"time"
)

func TestDateParser_Parse(t *testing.T) {
	tests := []struct {
		name            string
		preferredFormat string
		input           string
		wantDay         int
		wantMonth       time.Month
		wantYear        int
		wantError       bool
	}{
		// DD/MM/YYYY format
		{
			name:            "DD/MM/YYYY format",
			preferredFormat: "DD/MM/YYYY",
			input:           "15/01/2026",
			wantDay:         15,
			wantMonth:       time.January,
			wantYear:        2026,
			wantError:       false,
		},
		{
			name:            "MM/DD/YYYY format",
			preferredFormat: "MM/DD/YYYY",
			input:           "01/15/2026",
			wantDay:         15,
			wantMonth:       time.January,
			wantYear:        2026,
			wantError:       false,
		},
		// YYYY-MM-DD format (ISO 8601)
		{
			name:            "ISO 8601 format",
			preferredFormat: "",
			input:           "2026-01-15",
			wantDay:         15,
			wantMonth:       time.January,
			wantYear:        2026,
			wantError:       false,
		},
		// DD-MM-YYYY format
		{
			name:            "DD-MM-YYYY format",
			preferredFormat: "DD-MM-YYYY",
			input:           "15-01-2026",
			wantDay:         15,
			wantMonth:       time.January,
			wantYear:        2026,
			wantError:       false,
		},
		// DD MMM YYYY format
		{
			name:            "DD MMM YYYY format",
			preferredFormat: "",
			input:           "15 Jan 2026",
			wantDay:         15,
			wantMonth:       time.January,
			wantYear:        2026,
			wantError:       false,
		},
		{
			name:            "DD Month YYYY format",
			preferredFormat: "",
			input:           "15 January 2026",
			wantDay:         15,
			wantMonth:       time.January,
			wantYear:        2026,
			wantError:       false,
		},
		// DD/MM/YY format (2-digit year)
		{
			name:            "DD/MM/YY format - recent year",
			preferredFormat: "DD/MM/YYYY",
			input:           "15/01/26",
			wantDay:         15,
			wantMonth:       time.January,
			wantYear:        2026,
			wantError:       false,
		},
		{
			name:            "DD/MM/YY format - old year",
			preferredFormat: "DD/MM/YYYY",
			input:           "15/01/99",
			wantDay:         15,
			wantMonth:       time.January,
			wantYear:        1999,
			wantError:       false,
		},
		// Ambiguous date resolution - DD/MM vs MM/DD
		{
			name:            "Ambiguous date - prefers DD/MM",
			preferredFormat: "DD/MM/YYYY",
			input:           "05/03/2025",
			wantDay:         5,
			wantMonth:       time.March,
			wantYear:        2025,
			wantError:       false,
		},
		{
			name:            "Ambiguous date - prefers MM/DD",
			preferredFormat: "MM/DD/YYYY",
			input:           "03/05/2025",
			wantDay:         5,
			wantMonth:       time.March,
			wantYear:        2025,
			wantError:       false,
		},
		{
			name:            "Unambiguous date - day > 12",
			preferredFormat: "DD/MM/YYYY",
			input:           "25/01/2026",
			wantDay:         25,
			wantMonth:       time.January,
			wantYear:        2026,
			wantError:       false,
		},
		// Vietnamese month names
		{
			name:            "Vietnamese month name",
			preferredFormat: "",
			input:           "15 Tháng 1 2026",
			wantDay:         15,
			wantMonth:       time.January,
			wantYear:        2026,
			wantError:       false,
		},
		{
			name:            "Vietnamese lowercase month",
			preferredFormat: "",
			input:           "15 tháng 12 2025",
			wantDay:         15,
			wantMonth:       time.December,
			wantYear:        2025,
			wantError:       false,
		},
		// Date with time
		{
			name:            "Date with time YYYY-MM-DD",
			preferredFormat: "",
			input:           "2026-01-15 14:30:00",
			wantDay:         15,
			wantMonth:       time.January,
			wantYear:        2026,
			wantError:       false,
		},
		{
			name:            "Date with time DD/MM/YYYY",
			preferredFormat: "DD/MM/YYYY",
			input:           "15/01/2026 14:30:00",
			wantDay:         15,
			wantMonth:       time.January,
			wantYear:        2026,
			wantError:       false,
		},
		// Edge cases - single digit day/month
		{
			name:            "Single digit day and month",
			preferredFormat: "",
			input:           "5 Jan 2026",
			wantDay:         5,
			wantMonth:       time.January,
			wantYear:        2026,
			wantError:       false,
		},
		// Unix timestamp
		{
			name:            "Unix timestamp seconds",
			preferredFormat: "",
			input:           "1705276800", // 2024-01-15
			wantDay:         15,
			wantMonth:       time.January,
			wantYear:        2024,
			wantError:       false,
		},
		{
			name:            "Unix timestamp milliseconds",
			preferredFormat: "",
			input:           "1705276800000", // 2024-01-15
			wantDay:         15,
			wantMonth:       time.January,
			wantYear:        2024,
			wantError:       false,
		},
		// Error cases
		{
			name:            "Empty string",
			preferredFormat: "",
			input:           "",
			wantError:       true,
		},
		{
			name:            "Invalid format",
			preferredFormat: "",
			input:           "not a date",
			wantError:       true,
		},
		{
			name:            "Invalid day",
			preferredFormat: "DD/MM/YYYY",
			input:           "32/01/2026",
			wantError:       true,
		},
		{
			name:            "Invalid month",
			preferredFormat: "DD/MM/YYYY",
			input:           "15/13/2026",
			wantError:       true,
		},
		// Future date validation (should fail)
		{
			name:            "Future date",
			preferredFormat: "",
			input:           "01/01/2099",
			wantError:       true,
		},
		// Old date validation (>50 years should fail)
		{
			name:            "Very old date",
			preferredFormat: "",
			input:           "01/01/1950",
			wantError:       true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			parser := NewDateParser(tt.preferredFormat)
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

			if got.Day() != tt.wantDay {
				t.Errorf("Parse() day = %v, want %v", got.Day(), tt.wantDay)
			}
			if got.Month() != tt.wantMonth {
				t.Errorf("Parse() month = %v, want %v", got.Month(), tt.wantMonth)
			}
			if got.Year() != tt.wantYear {
				t.Errorf("Parse() year = %v, want %v", got.Year(), tt.wantYear)
			}
		})
	}
}

func TestDateParser_AmbiguityResolution(t *testing.T) {
	// Test that ambiguous dates are resolved according to preferred format
	tests := []struct {
		name            string
		preferredFormat string
		input           string
		wantDay         int
		wantMonth       time.Month
	}{
		{
			name:            "05/03 as DD/MM",
			preferredFormat: "DD/MM/YYYY",
			input:           "05/03/2025",
			wantDay:         5,
			wantMonth:       time.March,
		},
		{
			name:            "05/03 as MM/DD",
			preferredFormat: "MM/DD/YYYY",
			input:           "05/03/2025",
			wantDay:         3,
			wantMonth:       time.May,
		},
		{
			name:            "01/02 as DD/MM",
			preferredFormat: "DD/MM/YYYY",
			input:           "01/02/2025",
			wantDay:         1,
			wantMonth:       time.February,
		},
		{
			name:            "01/02 as MM/DD",
			preferredFormat: "MM/DD/YYYY",
			input:           "01/02/2025",
			wantDay:         2,
			wantMonth:       time.January,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			parser := NewDateParser(tt.preferredFormat)
			got, err := parser.Parse(tt.input)

			if err != nil {
				t.Fatalf("Parse() error = %v", err)
			}

			if got.Day() != tt.wantDay {
				t.Errorf("Parse() day = %v, want %v", got.Day(), tt.wantDay)
			}
			if got.Month() != tt.wantMonth {
				t.Errorf("Parse() month = %v, want %v", got.Month(), tt.wantMonth)
			}
		})
	}
}

func TestDateParser_VietnameseMonths(t *testing.T) {
	tests := []struct {
		input     string
		wantMonth time.Month
	}{
		{"15 Tháng 1 2025", time.January},
		{"15 Tháng 2 2025", time.February},
		{"15 Tháng 3 2025", time.March},
		{"15 Tháng 4 2025", time.April},
		{"15 Tháng 5 2025", time.May},
		{"15 Tháng 6 2025", time.June},
		{"15 Tháng 7 2025", time.July},
		{"15 Tháng 8 2025", time.August},
		{"15 Tháng 9 2025", time.September},
		{"15 Tháng 10 2025", time.October},
		{"15 Tháng 11 2025", time.November},
		{"15 Tháng 12 2025", time.December},
		{"15 tháng 6 2025", time.June}, // lowercase
	}

	parser := NewDateParser("")
	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got, err := parser.Parse(tt.input)
			if err != nil {
				t.Fatalf("Parse() error = %v", err)
			}
			if got.Month() != tt.wantMonth {
				t.Errorf("Parse() month = %v, want %v", got.Month(), tt.wantMonth)
			}
		})
	}
}

func TestDateParser_Timezone(t *testing.T) {
	parser := NewDateParser("DD/MM/YYYY")
	date, err := parser.Parse("15/01/2026")

	if err != nil {
		t.Fatalf("Parse() error = %v", err)
	}

	// Check that timezone is set correctly
	zone, _ := date.Zone()
	if zone != "+07" && zone != "UTC" { // +07 for Ho Chi Minh or UTC as fallback
		t.Errorf("Parse() timezone = %v, want +07 or UTC", zone)
	}
}
