package models

import (
	"time"

	"gorm.io/gorm"
)

// Budget represents a budget plan for expense tracking
type Budget struct {
	ID        int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    int32          `gorm:"not null;index" json:"userId"`
	Name      string         `gorm:"size:100;not null" json:"name"`
	Total     int64          `gorm:"type:bigint;default:0;not null" json:"total"` // Stored in smallest currency unit
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Items     []BudgetItem   `gorm:"foreignKey:BudgetID" json:"items,omitempty"`
	User      *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName specifies the table name for Budget model
func (Budget) TableName() string {
	return "budget"
}

// BudgetItem represents a single budget item (category allocation)
type BudgetItem struct {
	ID        int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	BudgetID  int32          `gorm:"not null;index" json:"budgetId"`
	Name      string         `gorm:"size:100;not null" json:"name"`
	Total     int64          `gorm:"type:bigint;default:0;not null" json:"total"` // Stored in smallest currency unit
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Budget    *Budget        `gorm:"foreignKey:BudgetID" json:"budget,omitempty"`
}

// TableName specifies the table name for BudgetItem model
func (BudgetItem) TableName() string {
	return "budget_item"
}
