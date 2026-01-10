package models

import (
	"time"
	v1 "wealthjourney/protobuf/v1"

	"gorm.io/gorm"
)

// Wallet represents a wallet in the system
type Wallet struct {
	ID         int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     int32          `gorm:"not null;index" json:"userId"`
	WalletName string         `gorm:"size:50" json:"walletName"`
	Balance    int64          `gorm:"type:bigint;default:0;not null" json:"balance"`
	Currency   string         `gorm:"size:3;default:'USD';not null" json:"currency"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
	User       *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Type       v1.WalletType  `gorm:"type:int;default:0;not null" json:"type"`
}

// TableName specifies the table name for Wallet model
func (Wallet) TableName() string {
	return "wallet"
}
