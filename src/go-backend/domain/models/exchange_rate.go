package models

import (
	"time"

	"gorm.io/gorm"
)

// ExchangeRate represents a historical exchange rate between two currencies
type ExchangeRate struct {
	ID           int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	FromCurrency string         `gorm:"size:3;not null;index:idx_fx_rate" json:"fromCurrency"` // ISO 4217 code
	ToCurrency   string         `gorm:"size:3;not null;index:idx_fx_rate" json:"toCurrency"`   // ISO 4217 code
	Rate         float64        `gorm:"type:decimal(20,8);not null" json:"rate"`               // Exchange rate (8 decimals for precision)
	RateDate     time.Time      `gorm:"type:date;not null;index:idx_fx_rate" json:"rateDate"`  // Date for which rate is valid
	Source       string         `gorm:"size:50;not null" json:"source"`                        // API source (e.g., "exchangerate-api.com")
	FetchedAt    time.Time      `gorm:"not null" json:"fetchedAt"`                             // When rate was fetched
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for ExchangeRate model
func (ExchangeRate) TableName() string {
	return "exchange_rate"
}
