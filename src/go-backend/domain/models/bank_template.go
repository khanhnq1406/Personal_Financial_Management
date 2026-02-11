package models

import "gorm.io/datatypes"

type BankTemplate struct {
	ID             string         `gorm:"primaryKey;size:50" json:"id"` // e.g., "vcb-credit-card"
	Name           string         `gorm:"size:100" json:"name"`
	BankCode       string         `gorm:"size:20" json:"bankCode"`
	StatementType  string         `gorm:"size:20" json:"statementType"` // credit, debit, checking
	FileFormats    datatypes.JSON `json:"fileFormats"` // ["csv", "excel", "pdf"]

	// Column mapping (JSON)
	ColumnMapping  datatypes.JSON `json:"columnMapping"`

	// Parsing rules (JSON)
	DateFormat     string         `gorm:"size:20" json:"dateFormat"`
	AmountFormat   datatypes.JSON `json:"amountFormat"`
	Currency       string         `gorm:"size:3" json:"currency"`

	// Detection rules (JSON)
	DetectionRules datatypes.JSON `json:"detectionRules"`
	TypeRules      datatypes.JSON `json:"typeRules"`

	Enabled        bool           `gorm:"default:true" json:"enabled"`
}

func (BankTemplate) TableName() string {
	return "bank_template"
}
