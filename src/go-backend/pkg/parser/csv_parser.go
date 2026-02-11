package parser

import (
	"encoding/csv"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// CSVParser handles parsing of bank statement CSV files
type CSVParser struct {
	filePath string
	mapping  *ColumnMapping
}

// ColumnMapping defines how CSV columns map to transaction fields
type ColumnMapping struct {
	DateColumn        int
	AmountColumn      int
	DescriptionColumn int
	TypeColumn        int    // -1 if not present
	CategoryColumn    int    // -1 if not present
	ReferenceColumn   int    // -1 if not present
	DateFormat        string // Optional: specific format to try first
	Currency          string
}

// ParsedRow represents a single parsed transaction row
type ParsedRow struct {
	RowNumber        int
	Date             time.Time
	Amount           int64  // Smallest currency unit (×10000 for 4 decimal precision)
	Description      string
	Type             string // "income" or "expense"
	CategoryID       int32
	ReferenceNum     string
	ValidationErrors []ValidationError
	IsValid          bool
}

// ValidationError represents a validation error for a specific field
type ValidationError struct {
	Field    string
	Message  string
	Severity string // "error", "warning", "info"
}

func NewCSVParser(filePath string, mapping *ColumnMapping) *CSVParser {
	return &CSVParser{
		filePath: filePath,
		mapping:  mapping,
	}
}

func (p *CSVParser) Parse() ([]*ParsedRow, error) {
	// Open the file
	file, err := os.Open(p.filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	// Create CSV reader
	reader := csv.NewReader(file)
	reader.TrimLeadingSpace = true
	reader.LazyQuotes = true
	reader.FieldsPerRecord = -1 // Allow variable number of fields

	// Read all rows
	rows, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV: %w", err)
	}

	if len(rows) == 0 {
		return nil, fmt.Errorf("CSV file is empty")
	}

	var parsedRows []*ParsedRow
	startRow := 0

	// Skip header row if present
	if p.hasHeader(rows[0]) {
		startRow = 1
	}

	// Parse each data row
	for i := startRow; i < len(rows); i++ {
		row := rows[i]
		rowNumber := i + 1 // 1-indexed for user display

		// Skip empty rows
		if p.isEmptyRow(row) {
			continue
		}

		// Skip summary rows
		if p.isSummaryRow(row) {
			continue
		}

		// Parse the row
		parsedRow := p.parseRow(rowNumber, row)
		parsedRows = append(parsedRows, parsedRow)
	}

	return parsedRows, nil
}

func (p *CSVParser) parseRow(rowNumber int, row []string) *ParsedRow {
	parsed := &ParsedRow{
		RowNumber:        rowNumber,
		IsValid:          true,
		ValidationErrors: []ValidationError{},
	}

	// Validate column indices
	maxCol := len(row) - 1
	if p.mapping.DateColumn > maxCol {
		parsed.addError("date", "Date column index out of range", "error")
	}
	if p.mapping.AmountColumn > maxCol {
		parsed.addError("amount", "Amount column index out of range", "error")
	}
	if p.mapping.DescriptionColumn > maxCol {
		parsed.addError("description", "Description column index out of range", "error")
	}

	// Parse date
	if p.mapping.DateColumn <= maxCol {
		dateStr := strings.TrimSpace(row[p.mapping.DateColumn])
		if dateStr == "" {
			parsed.addError("date", "Date is required", "error")
		} else {
			date, err := p.parseDate(dateStr)
			if err != nil {
				parsed.addError("date", fmt.Sprintf("Invalid date format: %v", err), "error")
			} else {
				parsed.Date = date
			}
		}
	}

	// Parse amount
	if p.mapping.AmountColumn <= maxCol {
		amountStr := strings.TrimSpace(row[p.mapping.AmountColumn])
		if amountStr == "" {
			parsed.addError("amount", "Amount is required", "error")
		} else {
			amount, err := p.parseAmount(amountStr)
			if err != nil {
				parsed.addError("amount", fmt.Sprintf("Invalid amount format: %v", err), "error")
			} else {
				parsed.Amount = amount
			}
		}
	}

	// Parse description
	if p.mapping.DescriptionColumn <= maxCol {
		description := strings.TrimSpace(row[p.mapping.DescriptionColumn])
		if description == "" {
			parsed.Description = "Imported Transaction"
			parsed.addError("description", "Description is empty, using default", "info")
		} else {
			parsed.Description = description
		}
	} else {
		parsed.Description = "Imported Transaction"
	}

	// Parse type (if column exists)
	var typeStr string
	if p.mapping.TypeColumn >= 0 && p.mapping.TypeColumn <= maxCol {
		typeStr = strings.TrimSpace(row[p.mapping.TypeColumn])
	}
	parsed.Type = p.detectType(typeStr, parsed.Amount)

	// Parse reference (if column exists)
	if p.mapping.ReferenceColumn >= 0 && p.mapping.ReferenceColumn <= maxCol {
		parsed.ReferenceNum = strings.TrimSpace(row[p.mapping.ReferenceColumn])
	}

	// Parse category (if column exists)
	if p.mapping.CategoryColumn >= 0 && p.mapping.CategoryColumn <= maxCol {
		categoryStr := strings.TrimSpace(row[p.mapping.CategoryColumn])
		if categoryStr != "" {
			// Note: Actual category ID mapping would be done by the service layer
			// For now, we just store 0 as placeholder
			parsed.CategoryID = 0
		}
	}

	return parsed
}

func (p *CSVParser) parseDate(dateStr string) (time.Time, error) {
	// If a specific format is provided, try it first
	if p.mapping != nil && p.mapping.DateFormat != "" {
		if date, err := time.Parse(p.mapping.DateFormat, dateStr); err == nil {
			return date, nil
		}
	}

	// Try multiple common date formats
	formats := []string{
		"02/01/2006",      // DD/MM/YYYY
		"01/02/2006",      // MM/DD/YYYY
		"2006-01-02",      // YYYY-MM-DD
		"02-01-2006",      // DD-MM-YYYY
		"02 Jan 2006",     // DD MMM YYYY
		"02/01/06",        // DD/MM/YY
		"01/02/06",        // MM/DD/YY
		"2006/01/02",      // YYYY/MM/DD
		"02-Jan-2006",     // DD-MMM-YYYY
		"02 January 2006", // DD Month YYYY
	}

	for _, format := range formats {
		if date, err := time.Parse(format, dateStr); err == nil {
			return date, nil
		}
	}

	return time.Time{}, fmt.Errorf("unable to parse date: %s", dateStr)
}

func (p *CSVParser) parseAmount(amountStr string) (int64, error) {
	// Remove whitespace
	amountStr = strings.TrimSpace(amountStr)
	if amountStr == "" {
		return 0, fmt.Errorf("empty amount")
	}

	// Track if amount is negative
	isNegative := false

	// Handle parentheses notation for negative amounts (100) → -100
	if strings.HasPrefix(amountStr, "(") && strings.HasSuffix(amountStr, ")") {
		isNegative = true
		amountStr = strings.TrimPrefix(amountStr, "(")
		amountStr = strings.TrimSuffix(amountStr, ")")
		amountStr = strings.TrimSpace(amountStr)
	}

	// Handle trailing minus: 100- → -100
	if strings.HasSuffix(amountStr, "-") {
		isNegative = true
		amountStr = strings.TrimSuffix(amountStr, "-")
		amountStr = strings.TrimSpace(amountStr)
	}

	// Handle leading minus: -100 → -100
	if strings.HasPrefix(amountStr, "-") {
		isNegative = true
		amountStr = strings.TrimPrefix(amountStr, "-")
		amountStr = strings.TrimSpace(amountStr)
	}

	// Remove currency symbols
	currencySymbols := []string{"₫", "$", "€", "£", "¥", "USD", "VND", "EUR", "GBP", "JPY"}
	for _, symbol := range currencySymbols {
		amountStr = strings.ReplaceAll(amountStr, symbol, "")
	}
	amountStr = strings.TrimSpace(amountStr)

	// Remove thousands separators (comma and space)
	amountStr = strings.ReplaceAll(amountStr, ",", "")
	amountStr = strings.ReplaceAll(amountStr, " ", "")

	// Parse as float
	floatAmount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid number format: %s", amountStr)
	}

	// Apply negative sign if needed
	if isNegative {
		floatAmount = -floatAmount
	}

	// Convert to smallest currency unit (×10000 for 4 decimal precision)
	amount := int64(floatAmount * 10000)

	return amount, nil
}

func (p *CSVParser) detectType(typeStr string, amount int64) string {
	// Check explicit type column if provided
	if typeStr != "" {
		typeLower := strings.ToLower(typeStr)

		// Income keywords
		if strings.Contains(typeLower, "income") ||
			strings.Contains(typeLower, "credit") ||
			strings.Contains(typeLower, "deposit") ||
			strings.Contains(typeLower, "receive") ||
			strings.Contains(typeLower, "inflow") {
			return "income"
		}

		// Expense keywords
		if strings.Contains(typeLower, "expense") ||
			strings.Contains(typeLower, "debit") ||
			strings.Contains(typeLower, "withdrawal") ||
			strings.Contains(typeLower, "payment") ||
			strings.Contains(typeLower, "outflow") ||
			strings.Contains(typeLower, "spend") {
			return "expense"
		}
	}

	// Fall back to amount sign
	if amount >= 0 {
		return "income"
	}
	return "expense"
}

func (p *CSVParser) hasHeader(row []string) bool {
	// Check if first row contains common header keywords
	headerKeywords := []string{
		"date", "amount", "description", "balance", "transaction",
		"debit", "credit", "type", "category", "reference", "memo",
	}

	// Join all cells and check for keywords
	rowText := strings.ToLower(strings.Join(row, " "))

	for _, keyword := range headerKeywords {
		if strings.Contains(rowText, keyword) {
			return true
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
	// Check if the row contains summary keywords
	summaryKeywords := []string{
		"total", "balance", "summary", "subtotal",
		"grand total", "ending balance", "closing balance",
		"opening balance", "beginning balance",
	}

	// Join all cells and check for keywords
	rowText := strings.ToLower(strings.Join(row, " "))

	for _, keyword := range summaryKeywords {
		if strings.Contains(rowText, keyword) {
			return true
		}
	}

	return false
}

// addError adds a validation error to the ParsedRow and marks it as invalid if severity is "error"
func (pr *ParsedRow) addError(field, message, severity string) {
	pr.ValidationErrors = append(pr.ValidationErrors, ValidationError{
		Field:    field,
		Message:  message,
		Severity: severity,
	})

	if severity == "error" {
		pr.IsValid = false
	}
}
