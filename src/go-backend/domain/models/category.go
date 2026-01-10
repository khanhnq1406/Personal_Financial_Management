package models

import (
	"time"

	v1 "wealthjourney/protobuf/v1"

	"gorm.io/gorm"
)

// Category represents a transaction category in the system
type Category struct {
	ID        int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    int32          `gorm:"not null;index" json:"userId"`
	Name      string         `gorm:"size:100;not null" json:"name"`
	Type      v1.CategoryType `gorm:"type:int;not null;index" json:"type"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	User         *User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Transactions []Transaction `gorm:"foreignKey:CategoryID" json:"transactions,omitempty"`
}

// TableName specifies the table name for Category model
func (Category) TableName() string {
	return "category"
}

// BeforeCreate hook validates the category type
func (c *Category) BeforeCreate(tx *gorm.DB) error {
	// Ensure type is set to a valid value
	if c.Type == v1.CategoryType_CATEGORY_TYPE_UNSPECIFIED {
		c.Type = v1.CategoryType_CATEGORY_TYPE_EXPENSE // Default to expense
	}
	return nil
}

// IsValidType checks if the category type is valid
func (c *Category) IsValidType() bool {
	switch c.Type {
	case v1.CategoryType_CATEGORY_TYPE_INCOME, v1.CategoryType_CATEGORY_TYPE_EXPENSE:
		return true
	default:
		return false
	}
}

// GetTypeString returns the string representation of the category type
func (c *Category) GetTypeString() string {
	switch c.Type {
	case v1.CategoryType_CATEGORY_TYPE_INCOME:
		return "Income"
	case v1.CategoryType_CATEGORY_TYPE_EXPENSE:
		return "Expense"
	default:
		return "Unknown"
	}
}
