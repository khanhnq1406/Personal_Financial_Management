package models

import (
	"time"

	"gorm.io/gorm"
)

// MatchType represents the type of pattern matching to perform
type MatchType string

const (
	MatchTypeExact    MatchType = "exact"     // Exact string match
	MatchTypePrefix   MatchType = "prefix"    // Prefix match (starts with)
	MatchTypeContains MatchType = "contains"  // Contains match (substring)
	MatchTypeSuffix   MatchType = "suffix"    // Suffix match (ends with)
	MatchTypeRegex    MatchType = "regex"     // Regular expression match
)

// MerchantCategoryRule represents a mapping from merchant pattern to category
type MerchantCategoryRule struct {
	ID              int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	MerchantPattern string         `gorm:"size:255;not null;index:idx_merchant_pattern" json:"merchantPattern"`
	MatchType       MatchType      `gorm:"type:varchar(20);not null;default:'contains'" json:"matchType"`
	CategoryID      int32          `gorm:"not null;index:idx_category" json:"categoryId"`
	Confidence      int32          `gorm:"type:int;not null;default:100" json:"confidence"` // 0-100
	Region          string         `gorm:"size:10;default:'VN'" json:"region"`              // ISO 3166-1 alpha-2 code (VN, US, etc.)
	IsActive        bool           `gorm:"default:true;index:idx_active" json:"isActive"`
	UsageCount      int32          `gorm:"type:int;default:0" json:"usageCount"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`

	Category *Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}

// TableName specifies the table name for MerchantCategoryRule model
func (MerchantCategoryRule) TableName() string {
	return "merchant_category_rule"
}

// BeforeCreate hook validates the rule before creation
func (m *MerchantCategoryRule) BeforeCreate(tx *gorm.DB) error {
	// Validate match type
	switch m.MatchType {
	case MatchTypeExact, MatchTypePrefix, MatchTypeContains, MatchTypeSuffix, MatchTypeRegex:
		// Valid match type
	default:
		m.MatchType = MatchTypeContains // Default to contains
	}

	// Validate confidence range
	if m.Confidence < 0 {
		m.Confidence = 0
	} else if m.Confidence > 100 {
		m.Confidence = 100
	}

	// Set default region if not provided
	if m.Region == "" {
		m.Region = "VN"
	}

	return nil
}
