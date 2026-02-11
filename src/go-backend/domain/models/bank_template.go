package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// BankTemplate represents a pre-configured template for parsing bank statements
type BankTemplate struct {
	ID             string         `gorm:"primaryKey;size:50" json:"id"` // e.g., "vcb-credit-card-csv"
	Name           string         `gorm:"size:100;not null" json:"name"`
	BankCode       string         `gorm:"size:20;not null;index" json:"bankCode"` // e.g., "VCB", "TCB"
	StatementType  string         `gorm:"size:20;not null" json:"statementType"`  // credit, debit, checking
	FileFormats    datatypes.JSON `json:"fileFormats"`                            // ["csv", "excel", "pdf"]
	ColumnMapping  datatypes.JSON `gorm:"not null" json:"columnMapping"`
	DateFormat     string         `gorm:"size:20;not null" json:"dateFormat"` // e.g., "DD/MM/YYYY"
	AmountFormat   datatypes.JSON `gorm:"not null" json:"amountFormat"`
	Currency       string         `gorm:"size:3;not null" json:"currency"` // ISO 4217
	DetectionRules datatypes.JSON `json:"detectionRules"`
	TypeRules      datatypes.JSON `json:"typeRules"`
	Region         string         `gorm:"size:2;default:'VN';index" json:"region"` // ISO 3166-1 alpha-2
	IsActive       bool           `gorm:"default:true;index" json:"isActive"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

func (BankTemplate) TableName() string {
	return "bank_template"
}

// UserTemplate represents a user's custom import template
type UserTemplate struct {
	ID            int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID        int32          `gorm:"not null;index" json:"userId"`
	Name          string         `gorm:"size:100;not null" json:"name"`
	ColumnMapping datatypes.JSON `gorm:"not null" json:"columnMapping"`
	DateFormat    string         `gorm:"size:20;not null" json:"dateFormat"`
	AmountFormat  datatypes.JSON `gorm:"not null" json:"amountFormat"`
	Currency      string         `gorm:"size:3;not null" json:"currency"`
	FileFormats   datatypes.JSON `json:"fileFormats"` // ["csv", "excel", "pdf"]
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
	User          *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (UserTemplate) TableName() string {
	return "user_template"
}
