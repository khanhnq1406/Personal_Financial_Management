package models

import (
	"time"

	"gorm.io/gorm"
)

// UserCategoryMapping represents a user's learned category mapping for specific description patterns
type UserCategoryMapping struct {
	ID                 int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID             int32          `gorm:"not null;index:idx_user_pattern,priority:1" json:"userId"`
	DescriptionPattern string         `gorm:"size:255;not null;index:idx_user_pattern,priority:2" json:"descriptionPattern"`
	CategoryID         int32          `gorm:"not null;index:idx_category" json:"categoryId"`
	Confidence         int32          `gorm:"type:int;not null;default:95" json:"confidence"` // 0-100, typically 95 for user learning
	UsageCount         int32          `gorm:"type:int;default:1" json:"usageCount"`
	LastUsedAt         time.Time      `gorm:"not null;index:idx_last_used" json:"lastUsedAt"`
	CreatedAt          time.Time      `json:"createdAt"`
	UpdatedAt          time.Time      `json:"updatedAt"`
	DeletedAt          gorm.DeletedAt `gorm:"index" json:"-"`

	User     *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Category *Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}

// TableName specifies the table name for UserCategoryMapping model
func (UserCategoryMapping) TableName() string {
	return "user_category_mapping"
}

// BeforeCreate hook validates the mapping before creation
func (m *UserCategoryMapping) BeforeCreate(tx *gorm.DB) error {
	// Validate confidence range
	if m.Confidence < 0 {
		m.Confidence = 0
	} else if m.Confidence > 100 {
		m.Confidence = 100
	}

	// Set LastUsedAt to now if not set
	if m.LastUsedAt.IsZero() {
		m.LastUsedAt = time.Now()
	}

	// Ensure UsageCount is at least 1
	if m.UsageCount < 1 {
		m.UsageCount = 1
	}

	return nil
}
