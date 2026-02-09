package models

import (
	"time"

	"gorm.io/gorm"
)

// PortfolioHistory stores historical portfolio value snapshots
// Used for sparkline charts and historical performance tracking
type PortfolioHistory struct {
	ID        int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    int32          `gorm:"not null;index:idx_user_wallet" json:"userId"`
	WalletID  int32          `gorm:"not null;index:idx_user_wallet;index:idx_wallet_timestamp" json:"walletId"`
	TotalValue int64          `gorm:"type:bigint;not null" json:"totalValue"`
	TotalCost  int64          `gorm:"type:bigint;not null" json:"totalCost"`
	TotalPnl   int64          `gorm:"type:bigint;not null" json:"totalPnl"`
	Currency   string         `gorm:"size:3;not null" json:"currency"`
	Timestamp  time.Time      `gorm:"not null;index:idx_wallet_timestamp" json:"timestamp"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for PortfolioHistory
func (PortfolioHistory) TableName() string {
	return "portfolio_history"
}

// IsDuplicate checks if this entry is a duplicate (same user, wallet, and timestamp within 1 hour)
func (ph *PortfolioHistory) IsDuplicate(existing *PortfolioHistory) bool {
	if existing == nil {
		return false
	}
	if ph.UserID != existing.UserID || ph.WalletID != existing.WalletID {
		return false
	}
	timeDiff := ph.Timestamp.Sub(existing.Timestamp)
	return timeDiff.Abs() < time.Hour
}
