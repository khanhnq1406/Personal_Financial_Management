package models

import (
	"time"

	"gorm.io/gorm"
)

// InvestmentLot tracks cost basis for FIFO (First-In, First-Out) accounting
//
// Each buy transaction creates or updates a lot. Sells consume from the oldest
// lots first (FIFO). This allows accurate tracking of realized gains/losses.
//
// Example for cryptocurrency (8 decimal places):
//   - Buy 1 BTC @ $50,000 → Lot: Quantity=100000000, AverageCost=5000000000000
//   - Buy 0.5 BTC @ $55,000 → Same lot updates to: Quantity=150000000, AverageCost=5166666666666
//   - Sell 0.7 BTC → Reduces RemainingQuantity to 80000000, calculates realized PNL
type InvestmentLot struct {
	ID                int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	InvestmentID      int32          `gorm:"not null;index:idx_lot_investment" json:"investmentId"`
	Quantity          int64          `gorm:"type:bigint;not null" json:"quantity"`
	RemainingQuantity int64          `gorm:"type:bigint;not null" json:"remainingQuantity"`
	AverageCost       int64          `gorm:"type:bigint;not null" json:"averageCost"`
	TotalCost         int64          `gorm:"type:bigint;not null" json:"totalCost"`
	Currency          string         `gorm:"size:3;not null;default:'USD'" json:"currency"`
	PurchasedAt       time.Time      `gorm:"not null;index" json:"purchasedAt"`
	CreatedAt         time.Time      `json:"createdAt"`
	UpdatedAt         time.Time      `json:"updatedAt"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Investment *Investment `gorm:"foreignKey:InvestmentID" json:"investment,omitempty"`
}

// TableName specifies the table name for InvestmentLot model
func (InvestmentLot) TableName() string {
	return "investment_lot"
}

// BeforeUpdate ensures RemainingQuantity never goes negative
// This GORM hook is called before any update operation
func (l *InvestmentLot) BeforeUpdate(tx *gorm.DB) error {
	if l.RemainingQuantity < 0 {
		l.RemainingQuantity = 0
	}
	return nil
}
