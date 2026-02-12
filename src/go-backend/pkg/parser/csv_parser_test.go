package parser

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestParseDate(t *testing.T) {
	parser := &CSVParser{}

	tests := []struct {
		name        string
		dateStr     string
		wantYear    int
		wantMonth   time.Month
		wantDay     int
		shouldError bool
	}{
		{
			name:      "DD/MM/YYYY format",
			dateStr:   "15/01/2026",
			wantYear:  2026,
			wantMonth: time.January,
			wantDay:   15,
		},
		{
			name:      "YYYY-MM-DD format",
			dateStr:   "2026-01-15",
			wantYear:  2026,
			wantMonth: time.January,
			wantDay:   15,
		},
		{
			name:      "DD MMM YYYY format",
			dateStr:   "15 Jan 2026",
			wantYear:  2026,
			wantMonth: time.January,
			wantDay:   15,
		},
		{
			name:        "Invalid date",
			dateStr:     "invalid",
			shouldError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			date, err := parser.parseDate(tt.dateStr)
			if tt.shouldError {
				if err == nil {
					t.Errorf("expected error but got none")
				}
				return
			}
			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}
			if date.Year() != tt.wantYear {
				t.Errorf("year = %v, want %v", date.Year(), tt.wantYear)
			}
			if date.Month() != tt.wantMonth {
				t.Errorf("month = %v, want %v", date.Month(), tt.wantMonth)
			}
			if date.Day() != tt.wantDay {
				t.Errorf("day = %v, want %v", date.Day(), tt.wantDay)
			}
		})
	}
}

func TestParseAmount(t *testing.T) {
	parser := &CSVParser{}

	tests := []struct {
		name      string
		amountStr string
		want      int64
	}{
		{
			name:      "Simple positive amount",
			amountStr: "100",
			want:      1000000, // 100 * 10000
		},
		{
			name:      "Amount with decimals",
			amountStr: "85.50",
			want:      855000, // 85.50 * 10000
		},
		{
			name:      "Amount with currency symbol",
			amountStr: "₫100,000",
			want:      1000000000, // 100000 * 10000
		},
		{
			name:      "Negative with parentheses",
			amountStr: "(100)",
			want:      -1000000, // -100 * 10000
		},
		{
			name:      "Negative with leading minus",
			amountStr: "-100",
			want:      -1000000,
		},
		{
			name:      "Amount with thousands separator",
			amountStr: "$1,234.56",
			want:      12345600, // 1234.56 * 10000
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parser.parseAmount(tt.amountStr)
			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}
			if got != tt.want {
				t.Errorf("parseAmount() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestDetectType(t *testing.T) {
	parser := &CSVParser{}

	tests := []struct {
		name    string
		typeStr string
		amount  int64
		want    string
	}{
		{
			name:    "Explicit income",
			typeStr: "income",
			amount:  1000000,
			want:    "income",
		},
		{
			name:    "Explicit expense",
			typeStr: "expense",
			amount:  -1000000,
			want:    "expense",
		},
		{
			name:    "Credit keyword",
			typeStr: "credit",
			amount:  1000000,
			want:    "income",
		},
		{
			name:    "Debit keyword",
			typeStr: "debit",
			amount:  -1000000,
			want:    "expense",
		},
		{
			name:    "Positive amount (no type)",
			typeStr: "",
			amount:  1000000,
			want:    "income",
		},
		{
			name:    "Negative amount (no type)",
			typeStr: "",
			amount:  -1000000,
			want:    "expense",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parser.detectType(tt.typeStr, tt.amount)
			if got != tt.want {
				t.Errorf("detectType() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestParse(t *testing.T) {
	// Create a temporary CSV file
	tmpDir := t.TempDir()
	csvFile := filepath.Join(tmpDir, "test.csv")

	csvContent := `Date,Amount,Description,Type
01/01/2026,"₫100,000",Coffee,Expense
02/01/2026,"(₫50,000)",Refund,Income
03/01/2026,$25.50,Lunch,Expense
`

	err := os.WriteFile(csvFile, []byte(csvContent), 0644)
	if err != nil {
		t.Fatalf("failed to create test CSV: %v", err)
	}

	// Create parser
	mapping := &ColumnMapping{
		DateColumn:        0,
		AmountColumn:      1,
		DescriptionColumn: 2,
		TypeColumn:        3,
		CategoryColumn:    -1,
		ReferenceColumn:   -1,
		Currency:          "VND",
	}

	parser := NewCSVParser(csvFile, mapping)
	rows, err := parser.Parse()
	if err != nil {
		t.Fatalf("Parse() error = %v", err)
	}

	if len(rows) != 3 {
		t.Errorf("expected 3 rows, got %d", len(rows))
	}

	// Verify first row
	if rows[0].Description != "Coffee" {
		t.Errorf("row 0 description = %v, want Coffee", rows[0].Description)
	}
	if rows[0].Type != "expense" {
		t.Errorf("row 0 type = %v, want expense", rows[0].Type)
	}

	// Verify second row (negative in parentheses)
	if rows[1].Type != "income" {
		t.Errorf("row 1 type = %v, want income", rows[1].Type)
	}

	// Verify all rows are valid
	for i, row := range rows {
		if !row.IsValid {
			t.Errorf("row %d is invalid: %v", i, row.ValidationErrors)
		}
	}
}

func TestHasHeader(t *testing.T) {
	parser := &CSVParser{}

	tests := []struct {
		name string
		row  []string
		want bool
	}{
		{
			name: "Header with date",
			row:  []string{"Date", "Amount", "Description"},
			want: true,
		},
		{
			name: "Header with transaction",
			row:  []string{"Transaction Date", "Amount", "Notes"},
			want: true,
		},
		{
			name: "Data row",
			row:  []string{"01/01/2026", "100", "Coffee"},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parser.hasHeader(tt.row)
			if got != tt.want {
				t.Errorf("hasHeader() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestIsEmptyRow(t *testing.T) {
	parser := &CSVParser{}

	tests := []struct {
		name string
		row  []string
		want bool
	}{
		{
			name: "Empty row",
			row:  []string{"", "", ""},
			want: true,
		},
		{
			name: "Row with whitespace",
			row:  []string{"  ", "  ", "  "},
			want: true,
		},
		{
			name: "Row with data",
			row:  []string{"01/01/2026", "100", "Coffee"},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parser.isEmptyRow(tt.row)
			if got != tt.want {
				t.Errorf("isEmptyRow() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestIsSummaryRow(t *testing.T) {
	parser := &CSVParser{}

	tests := []struct {
		name string
		row  []string
		want bool
	}{
		{
			name: "Total row",
			row:  []string{"Total", "1000", ""},
			want: true,
		},
		{
			name: "Balance row",
			row:  []string{"Ending Balance", "5000", ""},
			want: true,
		},
		{
			name: "Data row",
			row:  []string{"01/01/2026", "100", "Coffee"},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parser.isSummaryRow(tt.row)
			if got != tt.want {
				t.Errorf("isSummaryRow() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestParseWithValidationErrors(t *testing.T) {
	// Create a temporary CSV file with various validation errors
	tmpDir := t.TempDir()
	csvFile := filepath.Join(tmpDir, "test_errors.csv")

	csvContent := `Date,Amount,Description
01/01/2026,100,Valid Transaction
invalid-date,200,Bad Date
02/01/2026,invalid-amount,Bad Amount
03/01/2026,300,
04/01/2026,,Missing Amount
,100,Missing Date
`

	err := os.WriteFile(csvFile, []byte(csvContent), 0644)
	if err != nil {
		t.Fatalf("failed to create test CSV: %v", err)
	}

	// Create parser
	mapping := &ColumnMapping{
		DateColumn:        0,
		AmountColumn:      1,
		DescriptionColumn: 2,
		TypeColumn:        -1,
		CategoryColumn:    -1,
		ReferenceColumn:   -1,
		Currency:          "VND",
	}

	parser := NewCSVParser(csvFile, mapping)
	rows, err := parser.Parse()
	if err != nil {
		t.Fatalf("Parse() error = %v", err)
	}

	// Verify we got all rows
	if len(rows) != 6 {
		t.Errorf("expected 6 rows, got %d", len(rows))
	}

	// Row 0: Valid
	if !rows[0].IsValid {
		t.Errorf("row 0 should be valid, errors: %v", rows[0].ValidationErrors)
	}

	// Row 1: Bad date
	if rows[1].IsValid {
		t.Errorf("row 1 should be invalid")
	}
	if len(rows[1].ValidationErrors) == 0 {
		t.Errorf("row 1 should have validation errors")
	}

	// Row 2: Bad amount
	if rows[2].IsValid {
		t.Errorf("row 2 should be invalid")
	}

	// Row 3: Empty description (should use default, not invalid)
	if !rows[3].IsValid {
		t.Errorf("row 3 should be valid (empty description uses default)")
	}
	if rows[3].Description != "Imported Transaction" {
		t.Errorf("row 3 description = %v, want 'Imported Transaction'", rows[3].Description)
	}

	// Row 4: Missing amount
	if rows[4].IsValid {
		t.Errorf("row 4 should be invalid (missing amount)")
	}

	// Row 5: Missing date
	if rows[5].IsValid {
		t.Errorf("row 5 should be invalid (missing date)")
	}
}

func TestParseWithMultipleDateFormats(t *testing.T) {
	tmpDir := t.TempDir()
	csvFile := filepath.Join(tmpDir, "test_dates.csv")

	csvContent := `Date,Amount,Description
15/01/2026,100,DD/MM/YYYY
2026-01-15,100,YYYY-MM-DD
15 Jan 2026,100,DD MMM YYYY
15-01-2026,100,DD-MM-YYYY
2026/01/15,100,YYYY/MM/DD
`

	err := os.WriteFile(csvFile, []byte(csvContent), 0644)
	if err != nil {
		t.Fatalf("failed to create test CSV: %v", err)
	}

	mapping := &ColumnMapping{
		DateColumn:        0,
		AmountColumn:      1,
		DescriptionColumn: 2,
		TypeColumn:        -1,
		CategoryColumn:    -1,
		ReferenceColumn:   -1,
		Currency:          "VND",
	}

	parser := NewCSVParser(csvFile, mapping)
	rows, err := parser.Parse()
	if err != nil {
		t.Fatalf("Parse() error = %v", err)
	}

	// All rows should be valid
	for i, row := range rows {
		if !row.IsValid {
			t.Errorf("row %d should be valid, errors: %v", i, row.ValidationErrors)
		}
		// All should parse to the same date
		expectedYear, expectedMonth, expectedDay := 2026, time.January, 15
		if row.Date.Year() != expectedYear || row.Date.Month() != expectedMonth || row.Date.Day() != expectedDay {
			t.Errorf("row %d date = %v, want 2026-01-15", i, row.Date)
		}
	}
}
