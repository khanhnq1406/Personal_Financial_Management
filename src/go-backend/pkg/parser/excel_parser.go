package parser

import (
	"fmt"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
)

// ExcelParser handles parsing of bank statement Excel files (.xlsx, .xls)
type ExcelParser struct {
	filePath      string
	columnMapping *ColumnMapping
}

// NewExcelParser creates a new Excel parser instance
func NewExcelParser(filePath string, mapping *ColumnMapping) *ExcelParser {
	return &ExcelParser{
		filePath:      filePath,
		columnMapping: mapping,
	}
}

// Parse converts Excel file to ParsedRow format (matching CSV parser output)
func (p *ExcelParser) Parse() ([]*ParsedRow, error) {
	// Open Excel file
	f, err := excelize.OpenFile(p.filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open Excel file: %w", err)
	}
	defer func() {
		if err := f.Close(); err != nil {
			// Log error but don't fail the parse
			fmt.Printf("Warning: failed to close Excel file: %v\n", err)
		}
	}()

	// Get the first sheet name
	sheetName := f.GetSheetName(0)
	if sheetName == "" {
		return nil, fmt.Errorf("no sheets found in Excel file")
	}

	// Get all rows from the first sheet
	rows, err := f.GetRows(sheetName)
	if err != nil {
		return nil, fmt.Errorf("failed to read rows from Excel: %w", err)
	}

	if len(rows) == 0 {
		return nil, fmt.Errorf("Excel file is empty")
	}

	var parsedRows []*ParsedRow
	startRow := 0

	// Skip header row if present
	if p.hasHeader(rows[0]) {
		startRow = 1
	}

	// If no explicit column mapping, try to auto-detect from header
	mapping := p.columnMapping
	if mapping == nil && startRow == 1 {
		mapping = p.detectColumnsFromHeader(rows[0])
	}

	// If still no mapping, return error
	if mapping == nil {
		return nil, fmt.Errorf("column mapping is required. Either provide bankTemplateId or customMapping")
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
		parsedRow := p.parseRow(rowNumber, row, mapping)
		parsedRows = append(parsedRows, parsedRow)
	}

	return parsedRows, nil
}

// parseRow converts an Excel row to ParsedRow format
func (p *ExcelParser) parseRow(rowNumber int, row []string, mapping *ColumnMapping) *ParsedRow {
	parsed := &ParsedRow{
		RowNumber:        rowNumber,
		IsValid:          true,
		ValidationErrors: []ValidationError{},
	}

	// Validate column indices
	maxCol := len(row) - 1

	// Parse date
	if mapping.DateColumn <= maxCol {
		dateStr := strings.TrimSpace(row[mapping.DateColumn])
		if dateStr == "" {
			parsed.addError("date", "Date is required", "error")
		} else {
			date, err := p.parseDate(dateStr, mapping.DateFormat)
			if err != nil {
				parsed.addError("date", fmt.Sprintf("Invalid date format: %v", err), "error")
			} else {
				parsed.Date = date
			}
		}
	} else {
		parsed.addError("date", "Date column not found", "error")
	}

	// Parse amount
	if mapping.AmountColumn <= maxCol {
		amountStr := strings.TrimSpace(row[mapping.AmountColumn])
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
	} else {
		parsed.addError("amount", "Amount column not found", "error")
	}

	// Parse description
	if mapping.DescriptionColumn <= maxCol {
		description := strings.TrimSpace(row[mapping.DescriptionColumn])
		if description == "" {
			parsed.Description = "Imported Transaction"
			parsed.addError("description", "Description is empty, using default", "info")
		} else {
			parsed.Description = description
		}
	} else {
		parsed.Description = "Imported Transaction"
		parsed.addError("description", "Description column not found", "info")
	}

	// Parse type (if column exists)
	var typeStr string
	if mapping.TypeColumn >= 0 && mapping.TypeColumn <= maxCol {
		typeStr = strings.TrimSpace(row[mapping.TypeColumn])
	}
	parsed.Type = p.detectType(typeStr, parsed.Amount)

	// Parse reference (if column exists)
	if mapping.ReferenceColumn >= 0 && mapping.ReferenceColumn <= maxCol {
		parsed.ReferenceNum = strings.TrimSpace(row[mapping.ReferenceColumn])
	}

	return parsed
}

// hasHeader checks if the first row contains header keywords
func (p *ExcelParser) hasHeader(row []string) bool {
	headerKeywords := []string{
		"date", "amount", "description", "balance", "transaction",
		"debit", "credit", "type", "category", "reference", "memo",
		// Vietnamese keywords
		"ngày", "số tiền", "diễn giải", "mô tả", "số dư",
	}

	rowText := strings.ToLower(strings.Join(row, " "))

	for _, keyword := range headerKeywords {
		if strings.Contains(rowText, keyword) {
			return true
		}
	}

	return false
}

// isEmptyRow checks if a row is empty
func (p *ExcelParser) isEmptyRow(row []string) bool {
	for _, cell := range row {
		if strings.TrimSpace(cell) != "" {
			return false
		}
	}
	return true
}

// isSummaryRow checks if a row contains summary keywords
func (p *ExcelParser) isSummaryRow(row []string) bool {
	summaryKeywords := []string{
		"total", "balance", "summary", "subtotal",
		"grand total", "ending balance", "closing balance",
		"opening balance", "beginning balance",
		// Vietnamese keywords
		"tổng", "tổng cộng", "số dư",
	}

	rowText := strings.ToLower(strings.Join(row, " "))

	for _, keyword := range summaryKeywords {
		if strings.Contains(rowText, keyword) {
			return true
		}
	}

	return false
}

// detectColumnsFromHeader attempts to auto-detect column mapping from header row
func (p *ExcelParser) detectColumnsFromHeader(headerRow []string) *ColumnMapping {
	mapping := &ColumnMapping{
		DateColumn:        -1,
		AmountColumn:      -1,
		DescriptionColumn: -1,
		TypeColumn:        -1,
		CategoryColumn:    -1,
		ReferenceColumn:   -1,
		Currency:          "VND", // Default to VND
	}

	// Keywords for each column type (English + Vietnamese)
	dateKeywords := []string{"date", "ngày", "ngay", "posting date", "transaction date"}
	descKeywords := []string{"description", "diễn giải", "dien giai", "mô tả", "mo ta", "particulars", "details", "memo"}
	amountKeywords := []string{"amount", "số tiền", "so tien", "debit", "credit", "withdrawals", "deposits", "value"}
	refKeywords := []string{"reference", "số ct", "so ct", "ref", "transaction id", "ref no"}
	typeKeywords := []string{"type", "loại", "loai", "transaction type"}

	for i, cell := range headerRow {
		cellLower := strings.ToLower(cell)

		// Check for date column
		for _, keyword := range dateKeywords {
			if strings.Contains(cellLower, keyword) && mapping.DateColumn == -1 {
				mapping.DateColumn = i
				break
			}
		}

		// Check for description column
		for _, keyword := range descKeywords {
			if strings.Contains(cellLower, keyword) && mapping.DescriptionColumn == -1 {
				mapping.DescriptionColumn = i
				break
			}
		}

		// Check for amount column
		for _, keyword := range amountKeywords {
			if strings.Contains(cellLower, keyword) && mapping.AmountColumn == -1 {
				mapping.AmountColumn = i
				break
			}
		}

		// Check for reference column
		for _, keyword := range refKeywords {
			if strings.Contains(cellLower, keyword) && mapping.ReferenceColumn == -1 {
				mapping.ReferenceColumn = i
				break
			}
		}

		// Check for type column
		for _, keyword := range typeKeywords {
			if strings.Contains(cellLower, keyword) && mapping.TypeColumn == -1 {
				mapping.TypeColumn = i
				break
			}
		}
	}

	// Validate that required columns were found
	if mapping.DateColumn == -1 || mapping.AmountColumn == -1 || mapping.DescriptionColumn == -1 {
		return nil
	}

	return mapping
}

// parseDate parses a date string using multiple formats
func (p *ExcelParser) parseDate(dateStr string, preferredFormat string) (time.Time, error) {
	// If a specific format is provided, try it first
	if preferredFormat != "" {
		if date, err := time.Parse(preferredFormat, dateStr); err == nil {
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
		"2006-01-02 15:04:05", // YYYY-MM-DD HH:MM:SS
		"02/01/2006 15:04:05", // DD/MM/YYYY HH:MM:SS
	}

	for _, format := range formats {
		if date, err := time.Parse(format, dateStr); err == nil {
			return date, nil
		}
	}

	return time.Time{}, fmt.Errorf("unable to parse date: %s", dateStr)
}

// parseAmount parses an amount string (reusing CSV parser logic)
func (p *ExcelParser) parseAmount(amountStr string) (int64, error) {
	// Reuse the CSV parser's amount parsing logic
	csvParser := &CSVParser{}
	return csvParser.parseAmount(amountStr)
}

// detectType determines transaction type (reusing CSV parser logic)
func (p *ExcelParser) detectType(typeStr string, amount int64) string {
	csvParser := &CSVParser{}
	return csvParser.detectType(typeStr, amount)
}
