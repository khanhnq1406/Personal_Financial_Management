package parser

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/ledongthuc/pdf"

	"wealthjourney/pkg/validator"
)

// PDFParser handles parsing of bank statement PDF files
type PDFParser struct {
	filePath      string
	columnMapping *ColumnMapping
}

// NewPDFParser creates a new PDF parser instance
func NewPDFParser(filePath string, mapping *ColumnMapping) *PDFParser {
	return &PDFParser{
		filePath:      filePath,
		columnMapping: mapping,
	}
}

// ExtractTable extracts structured table data from PDF
func (p *PDFParser) ExtractTable() ([]TableRow, error) {
	// Open PDF file
	f, err := os.Open(p.filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open PDF: %w", err)
	}
	defer f.Close()

	// Get file size
	stat, err := f.Stat()
	if err != nil {
		return nil, fmt.Errorf("failed to get file info: %w", err)
	}

	// Create PDF reader
	reader, err := pdf.NewReader(f, stat.Size())
	if err != nil {
		// Try with encrypted reader (empty password)
		reader, err = pdf.NewReaderEncrypted(f, stat.Size(), func() string { return "" })
		if err != nil {
			return nil, fmt.Errorf("failed to create PDF reader: %w. PDF may be password-protected", err)
		}
	}

	// Extract styled text from all pages
	texts, err := reader.GetStyledTexts()
	if err != nil {
		return nil, fmt.Errorf("failed to extract text from PDF: %w", err)
	}

	if len(texts) == 0 {
		return nil, fmt.Errorf("no text found in PDF. It may be a scanned image. Please use OCR or export as CSV")
	}

	// Convert to text elements
	var elements []TextElement
	for _, text := range texts {
		if text.S == "" {
			continue
		}

		elements = append(elements, TextElement{
			X:        text.X,
			Y:        text.Y,
			Text:     text.S,
			FontSize: text.FontSize,
		})
	}

	if len(elements) == 0 {
		return nil, fmt.Errorf("no text found in PDF. It may be a scanned image. Please use OCR or export as CSV")
	}

	// Normalize Y coordinates (PDF origin is bottom-left, we want top-to-bottom)
	maxY := 0.0
	for _, elem := range elements {
		if elem.Y > maxY {
			maxY = elem.Y
		}
	}
	for i := range elements {
		elements[i].Y = maxY - elements[i].Y
	}

	// Use table detector to find structured data
	detector := NewTableDetector(elements, nil) // Use default config
	rows, err := detector.DetectTable()
	if err != nil {
		return nil, fmt.Errorf("failed to detect table structure: %w", err)
	}

	return rows, nil
}

// Parse converts PDF table to ParsedRow format (matching CSV parser output)
func (p *PDFParser) Parse() ([]*ParsedRow, error) {
	// Extract table from PDF
	tableRows, err := p.ExtractTable()
	if err != nil {
		return nil, err
	}

	if len(tableRows) == 0 {
		return nil, fmt.Errorf("no data rows found in PDF")
	}

	// Find header row
	detector := NewTableDetector(nil, nil) // Just need the config
	headerIndex := detector.FindHeaderRow(tableRows)

	// Skip header row if found
	startRow := 0
	if headerIndex >= 0 && headerIndex < len(tableRows) {
		startRow = headerIndex + 1
	}

	// If no explicit column mapping, try to auto-detect columns from header
	mapping := p.columnMapping
	if mapping == nil && headerIndex >= 0 {
		mapping = p.detectColumnsFromHeader(tableRows[headerIndex])
	}

	// If still no mapping, return error
	if mapping == nil {
		return nil, fmt.Errorf("column mapping is required for PDF parsing")
	}

	// Parse each data row
	var parsedRows []*ParsedRow
	for i := startRow; i < len(tableRows); i++ {
		row := tableRows[i]
		rowNumber := i + 1 // 1-indexed for user display

		// Skip empty rows
		if p.isEmptyRow(row.Cells) {
			continue
		}

		// Skip summary rows
		if p.isSummaryRow(row.Cells) {
			continue
		}

		// Parse the row
		parsedRow := p.parseRow(rowNumber, row.Cells, mapping)
		parsedRows = append(parsedRows, parsedRow)
	}

	return parsedRows, nil
}

// parseRow converts a table row to ParsedRow format
func (p *PDFParser) parseRow(rowNumber int, cells []string, mapping *ColumnMapping) *ParsedRow {
	parsed := &ParsedRow{
		RowNumber:        rowNumber,
		IsValid:          true,
		ValidationErrors: []ValidationError{},
	}

	// Validate column indices
	maxCol := len(cells) - 1

	// Parse date using enhanced date parser
	if mapping.DateColumn <= maxCol {
		dateStr := strings.TrimSpace(cells[mapping.DateColumn])
		if dateStr == "" {
			parsed.addError("date", "Date is required", "error")
		} else {
			dateParser := NewDateParser(mapping.DateFormat)
			date, err := dateParser.Parse(dateStr)
			if err != nil {
				parsed.addError("date", fmt.Sprintf("Invalid date format: %v", err), "error")
			} else {
				parsed.Date = date
			}
		}
	} else {
		parsed.addError("date", "Date column not found", "error")
	}

	// Parse amount using enhanced amount parser
	if mapping.AmountColumn <= maxCol {
		amountStr := strings.TrimSpace(cells[mapping.AmountColumn])
		if amountStr == "" {
			parsed.addError("amount", "Amount is required", "error")
		} else {
			amountParser := NewAmountParser(mapping.AmountFormat)
			amount, err := amountParser.Parse(amountStr)
			if err != nil {
				parsed.addError("amount", fmt.Sprintf("Invalid amount format: %v", err), "error")
			} else {
				parsed.Amount = amount
			}
		}
	} else {
		parsed.addError("amount", "Amount column not found", "error")
	}

	// Parse description and clean it
	if mapping.DescriptionColumn <= maxCol {
		description := strings.TrimSpace(cells[mapping.DescriptionColumn])
		if description == "" {
			parsed.Description = "Imported Transaction"
			parsed.addError("description", "Description is empty, using default", "info")
		} else {
			// Clean the description
			cleaner := NewDescriptionCleaner()
			parsed.Description = cleaner.Clean(description)
		}
	} else {
		parsed.Description = "Imported Transaction"
		parsed.addError("description", "Description column not found", "info")
	}

	// Parse type using enhanced type detector
	detector := NewTypeDetector()
	parsed.Type = detector.DetectType(parsed.Description, parsed.Amount)

	// Parse reference (if column exists)
	if mapping.ReferenceColumn >= 0 && mapping.ReferenceColumn <= maxCol {
		parsed.ReferenceNum = strings.TrimSpace(cells[mapping.ReferenceColumn])
	}

	// Apply business rules validation (if all required fields are parsed successfully)
	if parsed.IsValid {
		validationErrors := validator.ValidateTransaction(
			parsed.Amount,
			mapping.Currency,
			parsed.Description,
			parsed.Date,
		)

		for _, ve := range validationErrors {
			parsed.addError(ve.Field, ve.Message, ve.Severity)
		}
	}

	return parsed
}

// detectColumnsFromHeader attempts to auto-detect column mapping from header row
func (p *PDFParser) detectColumnsFromHeader(headerRow TableRow) *ColumnMapping {
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
	descKeywords := []string{"description", "diễn giải", "dien giai", "mô tả", "mo ta", "particulars", "details"}
	amountKeywords := []string{"amount", "số tiền", "so tien", "debit", "credit", "withdrawals", "deposits"}
	refKeywords := []string{"reference", "số ct", "so ct", "ref", "transaction id", "ref no"}

	for i, cell := range headerRow.Cells {
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
	}

	// Validate that required columns were found
	if mapping.DateColumn == -1 || mapping.AmountColumn == -1 || mapping.DescriptionColumn == -1 {
		return nil
	}

	return mapping
}

// parseDate is deprecated - use DateParser instead
func (p *PDFParser) parseDate(dateStr string, preferredFormat string) (time.Time, error) {
	dateParser := NewDateParser(preferredFormat)
	return dateParser.Parse(dateStr)
}

// parseAmount is deprecated - use AmountParser instead
func (p *PDFParser) parseAmount(amountStr string) (int64, error) {
	amountParser := NewAmountParserWithAutoDetect()
	return amountParser.Parse(amountStr)
}

// detectType is deprecated - use TypeDetector instead
func (p *PDFParser) detectType(typeStr string, amount int64) string {
	detector := NewTypeDetector()
	if typeStr != "" {
		return detector.DetectType(typeStr, amount)
	}
	return detector.DetectType("", amount)
}

// isEmptyRow checks if a row is empty
func (p *PDFParser) isEmptyRow(cells []string) bool {
	for _, cell := range cells {
		if strings.TrimSpace(cell) != "" {
			return false
		}
	}
	return true
}

// isSummaryRow checks if a row contains summary keywords
func (p *PDFParser) isSummaryRow(cells []string) bool {
	summaryKeywords := []string{
		"total", "balance", "summary", "subtotal",
		"grand total", "ending balance", "closing balance",
		"opening balance", "beginning balance",
		// Vietnamese keywords
		"tổng", "tổng cộng", "số dư", "cộng dồn",
		"số dư đầu kỳ", "số dư cuối kỳ",
	}

	rowText := strings.ToLower(strings.Join(cells, " "))

	for _, keyword := range summaryKeywords {
		if strings.Contains(rowText, keyword) {
			return true
		}
	}

	return false
}
