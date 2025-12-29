package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID        int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	Email     string         `gorm:"uniqueIndex;size:100;not null" json:"email"`
	Name      string         `gorm:"size:100" json:"name"`
	Picture   string         `gorm:"size:255" json:"picture"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for User model
func (User) TableName() string {
	return "user"
}
