package models

import (
	"time"

	"gorm.io/gorm"
)

// MarketData caches external market prices
// Reduces API calls to external services
type MarketData struct {
	ID        int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	Symbol    string         `gorm:"size:20;not null;uniqueIndex:idx_symbol_currency" json:"symbol"`
	Currency  string         `gorm:"size:3;not null;uniqueIndex:idx_symbol_currency" json:"currency"`
	Price     int64          `gorm:"type:bigint;not null" json:"price"`
	Change24h float64        `gorm:"type:double" json:"change24h"`
	Volume24h int64          `gorm:"type:bigint" json:"volume24h"`
	Timestamp time.Time      `gorm:"not null;index" json:"timestamp"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for MarketData
func (MarketData) TableName() string {
	return "market_data"
}

// IsExpired checks if the cached data is older than maxAge
func (md *MarketData) IsExpired(maxAge time.Duration) bool {
	age := time.Since(md.Timestamp)
	return age > maxAge
}
