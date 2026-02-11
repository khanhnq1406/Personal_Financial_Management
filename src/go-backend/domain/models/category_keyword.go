package models

import (
	"time"

	"gorm.io/gorm"
)

// Language represents the language of a keyword
type Language string

const (
	LanguageVietnamese Language = "vi" // Vietnamese
	LanguageEnglish    Language = "en" // English
)

// CategoryKeyword represents a keyword that helps identify transactions for a specific category
type CategoryKeyword struct {
	ID         int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	CategoryID int32          `gorm:"not null;index:idx_category_keyword" json:"categoryId"`
	Keyword    string         `gorm:"size:100;not null;index:idx_keyword" json:"keyword"`
	Language   Language       `gorm:"type:varchar(5);not null;default:'vi'" json:"language"`
	Confidence int32          `gorm:"type:int;not null;default:70" json:"confidence"` // 0-100, typically 70-85 for keyword matching
	IsActive   bool           `gorm:"default:true;index:idx_active" json:"isActive"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`

	Category *Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}

// TableName specifies the table name for CategoryKeyword model
func (CategoryKeyword) TableName() string {
	return "category_keyword"
}

// BeforeCreate hook validates the keyword before creation
func (k *CategoryKeyword) BeforeCreate(tx *gorm.DB) error {
	// Validate language
	switch k.Language {
	case LanguageVietnamese, LanguageEnglish:
		// Valid language
	default:
		k.Language = LanguageVietnamese // Default to Vietnamese
	}

	// Validate confidence range
	if k.Confidence < 0 {
		k.Confidence = 0
	} else if k.Confidence > 100 {
		k.Confidence = 100
	}

	return nil
}
