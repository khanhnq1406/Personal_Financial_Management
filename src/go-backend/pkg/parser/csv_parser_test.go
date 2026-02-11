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
			dateStr:   "15/01/2024",
			wantYear:  2024,
			wantMonth: time.January,
			wantDay:   15,
		},
		{
			name:      "YYYY-MM-DD format",
			dateStr:   "2024-01-15",
			wantYear:  2024,
			wantMonth: time.January,
			wantDay:   15,
		},
		{
			name:      "DD MMM YYYY format",
			dateStr:   "15 Jan 2024",
			wantYear:  2024,
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
01/01/2024,"₫100,000",Coffee,Expense
02/01/2024,"(₫50,000)",Refund,Income
03/01/2024,$25.50,Lunch,Expense
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
			row:  []string{"01/01/2024", "100", "Coffee"},
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
			row:  []string{"01/01/2024", "100", "Coffee"},
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
			row:  []string{"01/01/2024", "100", "Coffee"},
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
