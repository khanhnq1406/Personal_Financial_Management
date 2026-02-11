package parser

import (
	"encoding/csv"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type CSVParser struct {
	filePath string
	mapping  *ColumnMapping
}

type ColumnMapping struct {
	DateColumn        int
	AmountColumn      int
	DescriptionColumn int
	TypeColumn        int // -1 if not present
	CategoryColumn    int // -1 if not present
	ReferenceColumn   int // -1 if not present
	DateFormat        string
	Currency          string
}

type ParsedRow struct {
	RowNumber        int
	Date             time.Time
	Amount           int64 // Smallest currency unit
	Description      string
	Type             string // "income" or "expense"
	CategoryID       int32
	ReferenceNum     string
	ValidationErrors []ValidationError
	IsValid          bool
}

type ValidationError struct {
	Field    string
	Message  string
	Severity string // error, warning, info
}

func NewCSVParser(filePath string, mapping *ColumnMapping) *CSVParser {
	return &CSVParser{
		filePath: filePath,
		mapping:  mapping,
	}
}

func (p *CSVParser) Parse() ([]*ParsedRow, error) {
	file, err := os.Open(p.filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.TrimLeadingSpace = true
	reader.LazyQuotes = true

	// Read all rows
	rows, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV: %w", err)
	}

	if len(rows) == 0 {
		return nil, fmt.Errorf("CSV file is empty")
	}

	// Skip header row if present
	startRow := 0
	if p.hasHeader(rows[0]) {
		startRow = 1
	}

	var parsedRows []*ParsedRow

	for i := startRow; i < len(rows); i++ {
		row := rows[i]

		// Skip empty rows
		if p.isEmptyRow(row) {
			continue
		}

		// Skip summary rows
		if p.isSummaryRow(row) {
			continue
		}

		parsedRow := p.parseRow(i+1, row)
		parsedRows = append(parsedRows, parsedRow)
	}

	return parsedRows, nil
}

func (p *CSVParser) parseRow(rowNumber int, row []string) *ParsedRow {
	parsed := &ParsedRow{
		RowNumber: rowNumber,
		IsValid:   true,
	}

	// Parse date
	if p.mapping.DateColumn < len(row) {
		dateStr := strings.TrimSpace(row[p.mapping.DateColumn])
		date, err := p.parseDate(dateStr)
		if err != nil {
			parsed.ValidationErrors = append(parsed.ValidationErrors, ValidationError{
				Field:    "date",
				Message:  fmt.Sprintf("Invalid date: %s", err.Error()),
				Severity: "error",
			})
			parsed.IsValid = false
		} else {
			parsed.Date = date
		}
	} else {
		parsed.ValidationErrors = append(parsed.ValidationErrors, ValidationError{
			Field:    "date",
			Message:  "Date column missing",
			Severity: "error",
		})
		parsed.IsValid = false
	}

	// Parse amount
	if p.mapping.AmountColumn < len(row) {
		amountStr := strings.TrimSpace(row[p.mapping.AmountColumn])
		amount, err := p.parseAmount(amountStr)
		if err != nil {
			parsed.ValidationErrors = append(parsed.ValidationErrors, ValidationError{
				Field:    "amount",
				Message:  fmt.Sprintf("Invalid amount: %s", err.Error()),
				Severity: "error",
			})
			parsed.IsValid = false
		} else {
			parsed.Amount = amount
		}
	} else {
		parsed.ValidationErrors = append(parsed.ValidationErrors, ValidationError{
			Field:    "amount",
			Message:  "Amount column missing",
			Severity: "error",
		})
		parsed.IsValid = false
	}

	// Parse description
	if p.mapping.DescriptionColumn < len(row) {
		parsed.Description = strings.TrimSpace(row[p.mapping.DescriptionColumn])
		if len(parsed.Description) == 0 {
			parsed.Description = "Imported Transaction"
		}
	} else {
		parsed.Description = "Imported Transaction"
	}

	// Parse type (if available)
	if p.mapping.TypeColumn >= 0 && p.mapping.TypeColumn < len(row) {
		typeStr := strings.ToLower(strings.TrimSpace(row[p.mapping.TypeColumn]))
		parsed.Type = p.detectType(typeStr, parsed.Amount)
	} else {
		// Detect from amount sign
		parsed.Type = p.detectType("", parsed.Amount)
	}

	// Parse reference (if available)
	if p.mapping.ReferenceColumn >= 0 && p.mapping.ReferenceColumn < len(row) {
		parsed.ReferenceNum = strings.TrimSpace(row[p.mapping.ReferenceColumn])
	}

	return parsed
}

func (p *CSVParser) parseDate(dateStr string) (time.Time, error) {
	// Try parsing with specified format
	formats := []string{
		"02/01/2006", // DD/MM/YYYY
		"01/02/2006", // MM/DD/YYYY
		"2006-01-02", // YYYY-MM-DD
		"02-01-2006", // DD-MM-YYYY
		"02 Jan 2006", // DD MMM YYYY
	}

	for _, format := range formats {
		if date, err := time.Parse(format, dateStr); err == nil {
			return date, nil
		}
	}

	return time.Time{}, fmt.Errorf("unable to parse date: %s", dateStr)
}

func (p *CSVParser) parseAmount(amountStr string) (int64, error) {
	// Remove currency symbols and whitespace
	amountStr = strings.TrimSpace(amountStr)
	amountStr = strings.ReplaceAll(amountStr, "₫", "")
	amountStr = strings.ReplaceAll(amountStr, "$", "")
	amountStr = strings.ReplaceAll(amountStr, "€", "")
	amountStr = strings.ReplaceAll(amountStr, "£", "")
	amountStr = strings.TrimSpace(amountStr)

	// Handle parentheses for negative
	isNegative := false
	if strings.HasPrefix(amountStr, "(") && strings.HasSuffix(amountStr, ")") {
		isNegative = true
		amountStr = strings.Trim(amountStr, "()")
	}

	// Handle trailing minus
	if strings.HasSuffix(amountStr, "-") {
		isNegative = true
		amountStr = strings.TrimSuffix(amountStr, "-")
	}

	// Handle leading minus
	if strings.HasPrefix(amountStr, "-") {
		isNegative = true
		amountStr = strings.TrimPrefix(amountStr, "-")
	}

	// Remove thousands separators (assume comma)
	amountStr = strings.ReplaceAll(amountStr, ",", "")

	// Parse float
	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		return 0, err
	}

	if isNegative {
		amount = -amount
	}

	// Convert to smallest currency unit (multiply by 10000 for 4 decimal precision)
	return int64(amount * 10000), nil
}

func (p *CSVParser) detectType(typeStr string, amount int64) string {
	// Check explicit type column
	if strings.Contains(typeStr, "income") || strings.Contains(typeStr, "credit") || strings.Contains(typeStr, "deposit") {
		return "income"
	}
	if strings.Contains(typeStr, "expense") || strings.Contains(typeStr, "debit") || strings.Contains(typeStr, "withdrawal") {
		return "expense"
	}

	// Detect from amount sign
	if amount >= 0 {
		return "income"
	}
	return "expense"
}

func (p *CSVParser) hasHeader(row []string) bool {
	// Heuristic: if first row contains common header keywords
	keywords := []string{"date", "amount", "description", "balance", "transaction"}
	for _, cell := range row {
		cellLower := strings.ToLower(cell)
		for _, keyword := range keywords {
			if strings.Contains(cellLower, keyword) {
				return true
			}
		}
	}
	return false
}

func (p *CSVParser) isEmptyRow(row []string) bool {
	for _, cell := range row {
		if strings.TrimSpace(cell) != "" {
			return false
		}
	}
	return true
}

func (p *CSVParser) isSummaryRow(row []string) bool {
	// Check for summary keywords
	keywords := []string{"total", "balance", "summary", "subtotal"}
	for _, cell := range row {
		cellLower := strings.ToLower(cell)
		for _, keyword := range keywords {
			if strings.Contains(cellLower, keyword) {
				return true
			}
		}
	}
	return false
}
