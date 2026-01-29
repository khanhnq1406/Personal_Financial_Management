package models

import (
	"time"

	v1 "wealthjourney/protobuf/v1"

	"gorm.io/gorm"
)

// Transaction represents a financial transaction in the system
type Transaction struct {
	ID         int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	WalletID   int32          `gorm:"not null;index" json:"walletId"`
	CategoryID *int32         `gorm:"index" json:"categoryId"`
	Amount     int64          `gorm:"type:bigint;not null" json:"amount"` // Stored in smallest currency unit
	Currency   string         `gorm:"size:3;not null;default:'VND'" json:"currency"`
	Date       time.Time      `gorm:"not null;index" json:"date"`
	Note       string         `gorm:"type:text" json:"note"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`

	Wallet   *Wallet   `gorm:"foreignKey:WalletID" json:"wallet,omitempty"`
	Category *Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}

// TableName specifies the table name for Transaction model
func (Transaction) TableName() string {
	return "transaction"
}

// GetTransactionType returns the transaction type based on the category
func (t *Transaction) GetTransactionType() v1.TransactionType {
	if t.Category == nil {
		return v1.TransactionType_TRANSACTION_TYPE_UNSPECIFIED
	}
	switch t.Category.Type {
	case v1.CategoryType_CATEGORY_TYPE_INCOME:
		return v1.TransactionType_TRANSACTION_TYPE_INCOME
	case v1.CategoryType_CATEGORY_TYPE_EXPENSE:
		return v1.TransactionType_TRANSACTION_TYPE_EXPENSE
	default:
		return v1.TransactionType_TRANSACTION_TYPE_UNSPECIFIED
	}
}

// BeforeCreate hook sets the date to current time if not provided
func (t *Transaction) BeforeCreate(tx *gorm.DB) error {
	if t.Date.IsZero() {
		t.Date = time.Now()
	}
	return nil
}
