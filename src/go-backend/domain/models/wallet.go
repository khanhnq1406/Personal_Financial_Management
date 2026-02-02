package models

import (
	"time"
	v1 "wealthjourney/protobuf/v1"

	"gorm.io/gorm"
)

// Wallet represents a wallet in the system
type Wallet struct {
	ID         int32                `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     int32                `gorm:"not null;index" json:"userId"`
	WalletName string               `gorm:"size:50" json:"walletName"`
	Balance    int64                `gorm:"type:bigint;default:0;not null" json:"balance"`
	Currency   string               `gorm:"size:3;default:'USD';not null" json:"currency"`
	CreatedAt  time.Time            `json:"createdAt"`
	UpdatedAt  time.Time            `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt       `gorm:"index" json:"-"`
	User       *User                `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Type       int32                `gorm:"type:int;default:0;not null" json:"type"` // Stored as int32, converted to/from v1.WalletType
	Status     int32                `gorm:"type:int;default:1;not null;index" json:"status"` // Stored as int32, converted to/from v1.WalletStatus
}

// GetWalletType returns the protobuf WalletType enum value
func (w *Wallet) GetWalletType() v1.WalletType {
	return v1.WalletType(w.Type)
}

// SetWalletType sets the wallet type from protobuf enum
func (w *Wallet) SetWalletType(walletType v1.WalletType) {
	w.Type = int32(walletType)
}

// GetWalletStatus returns the protobuf WalletStatus enum value
func (w *Wallet) GetWalletStatus() v1.WalletStatus {
	return v1.WalletStatus(w.Status)
}

// SetWalletStatus sets the wallet status from protobuf enum
func (w *Wallet) SetWalletStatus(status v1.WalletStatus) {
	w.Status = int32(status)
}

// TableName specifies the table name for Wallet model
func (Wallet) TableName() string {
	return "wallet"
}
