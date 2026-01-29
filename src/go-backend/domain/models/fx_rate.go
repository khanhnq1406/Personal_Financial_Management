package models

import (
	"time"

	"gorm.io/gorm"
)

// FXRate represents a foreign exchange rate between two currencies
type FXRate struct {
	ID           int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	FromCurrency string         `gorm:"size:3;not null;index:idx_fx_pair,priority:1" json:"fromCurrency"`
	ToCurrency   string         `gorm:"size:3;not null;index:idx_fx_pair,priority:2" json:"toCurrency"`
	Rate         float64        `gorm:"type:double precision;not null" json:"rate"`
	Timestamp    time.Time      `gorm:"not null;index" json:"timestamp"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for FXRate model
func (FXRate) TableName() string {
	return "fx_rate"
}

// BeforeCreate sets the timestamp to current time if not provided
func (f *FXRate) BeforeCreate(tx *gorm.DB) error {
	if f.Timestamp.IsZero() {
		f.Timestamp = time.Now()
	}
	return nil
}
