package parser

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestTableDetector_GroupElementsByRow(t *testing.T) {
	elements := []TextElement{
		{X: 10, Y: 100, Text: "Date"},
		{X: 50, Y: 100, Text: "Description"},
		{X: 150, Y: 100, Text: "Amount"},
		{X: 10, Y: 120, Text: "01/01/2024"},
		{X: 50, Y: 120, Text: "Coffee"},
		{X: 150, Y: 120, Text: "50,000"},
		{X: 10, Y: 140, Text: "02/01/2024"},
		{X: 50, Y: 140, Text: "Lunch"},
		{X: 150, Y: 140, Text: "100,000"},
	}

	detector := NewTableDetector(elements, nil)
	rows := detector.groupElementsByRow()

	assert.Equal(t, 3, len(rows), "Should have 3 rows")
	assert.Equal(t, 3, len(rows[0]), "First row should have 3 elements")
	assert.Equal(t, "Date", rows[0][0].Text)
	assert.Equal(t, "01/01/2024", rows[1][0].Text)
}

func TestTableDetector_DetectColumnBoundaries(t *testing.T) {
	rows := [][]TextElement{
		{
			{X: 10, Y: 100, Text: "Date"},
			{X: 50, Y: 100, Text: "Description"},
			{X: 150, Y: 100, Text: "Amount"},
		},
		{
			{X: 10, Y: 120, Text: "01/01/2024"},
			{X: 50, Y: 120, Text: "Coffee"},
			{X: 150, Y: 120, Text: "50,000"},
		},
	}

	detector := NewTableDetector(nil, nil)
	boundaries := detector.detectColumnBoundaries(rows)

	assert.GreaterOrEqual(t, len(boundaries), 3, "Should detect at least 3 column boundaries")
}

func TestTableDetector_FindHeaderRow(t *testing.T) {
	tableRows := []TableRow{
		{Cells: []string{"Date", "Description", "Amount"}},
		{Cells: []string{"01/01/2024", "Coffee", "50,000"}},
		{Cells: []string{"02/01/2024", "Lunch", "100,000"}},
	}

	detector := NewTableDetector(nil, nil)
	headerIndex := detector.FindHeaderRow(tableRows)

	assert.Equal(t, 0, headerIndex, "Should identify first row as header")
}

func TestPDFParser_IsEmptyRow(t *testing.T) {
	parser := &PDFParser{}

	assert.True(t, parser.isEmptyRow([]string{"", "", ""}))
	assert.True(t, parser.isEmptyRow([]string{"  ", "\t", " "}))
	assert.False(t, parser.isEmptyRow([]string{"", "data", ""}))
}

func TestPDFParser_IsSummaryRow(t *testing.T) {
	parser := &PDFParser{}

	assert.True(t, parser.isSummaryRow([]string{"Total", "1,000,000"}))
	assert.True(t, parser.isSummaryRow([]string{"Ending Balance", "500,000"}))
	assert.False(t, parser.isSummaryRow([]string{"Coffee", "50,000"}))
}

func TestPDFParser_DetectColumnsFromHeader(t *testing.T) {
	parser := &PDFParser{}
	headerRow := TableRow{
		Cells: []string{"Date", "Description", "Amount", "Reference"},
	}

	mapping := parser.detectColumnsFromHeader(headerRow)

	assert.NotNil(t, mapping, "Should detect column mapping")
	assert.Equal(t, 0, mapping.DateColumn, "Date should be column 0")
	assert.Equal(t, 1, mapping.DescriptionColumn, "Description should be column 1")
	assert.Equal(t, 2, mapping.AmountColumn, "Amount should be column 2")
	assert.Equal(t, 3, mapping.ReferenceColumn, "Reference should be column 3")
}

func TestPDFParser_DetectColumnsFromVietnameseHeader(t *testing.T) {
	parser := &PDFParser{}
	headerRow := TableRow{
		Cells: []string{"Ngày", "Diễn giải", "Số tiền", "Số CT"},
	}

	mapping := parser.detectColumnsFromHeader(headerRow)

	assert.NotNil(t, mapping, "Should detect Vietnamese column mapping")
	assert.Equal(t, 0, mapping.DateColumn, "Ngày should be date column")
	assert.Equal(t, 1, mapping.DescriptionColumn, "Diễn giải should be description column")
	assert.Equal(t, 2, mapping.AmountColumn, "Số tiền should be amount column")
	assert.Equal(t, 3, mapping.ReferenceColumn, "Số CT should be reference column")
}
