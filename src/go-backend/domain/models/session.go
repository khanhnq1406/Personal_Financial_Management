package models

import (
	"time"

	"github.com/google/uuid"
)

// Session represents a user authentication session across devices
type Session struct {
	ID           int32     `gorm:"primaryKey;autoIncrement" json:"id"`
	SessionID    string    `gorm:"uniqueIndex;size:36;not null" json:"sessionId"` // UUID
	UserID       int32     `gorm:"index;not null" json:"userId"`
	Token        string    `gorm:"type:text;not null" json:"token"` // JWT token
	DeviceName   string    `gorm:"size:100" json:"deviceName"`
	DeviceType   string    `gorm:"size:50" json:"deviceType"`   // "mobile", "desktop", "tablet"
	IpAddress    string    `gorm:"size:45" json:"ipAddress"`    // IPv4 or IPv6
	UserAgent    string    `gorm:"type:text" json:"userAgent"`
	LastActiveAt time.Time `gorm:"not null" json:"lastActiveAt"`
	ExpiresAt    time.Time `gorm:"not null" json:"expiresAt"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`

	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (Session) TableName() string {
	return "sessions"
}

// IsExpired checks if the session has expired
func (s *Session) IsExpired() bool {
	return time.Now().After(s.ExpiresAt)
}

// GenerateSessionID creates a new unique session identifier
func GenerateSessionID() string {
	return uuid.New().String()
}
