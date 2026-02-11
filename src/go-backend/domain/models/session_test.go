package models_test

import (
	"testing"
	"time"
	"wealthjourney/domain/models"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestSession_TableName(t *testing.T) {
	session := models.Session{}
	assert.Equal(t, "sessions", session.TableName())
}

func TestSession_IsExpired(t *testing.T) {
	tests := []struct {
		name      string
		expiresAt time.Time
		want      bool
	}{
		{
			name:      "expired session",
			expiresAt: time.Now().Add(-1 * time.Hour),
			want:      true,
		},
		{
			name:      "valid session",
			expiresAt: time.Now().Add(1 * time.Hour),
			want:      false,
		},
		{
			name:      "just expired",
			expiresAt: time.Now().Add(-1 * time.Second),
			want:      true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			session := &models.Session{
				ExpiresAt: tt.expiresAt,
			}
			assert.Equal(t, tt.want, session.IsExpired())
		})
	}
}

func TestSession_GenerateSessionID(t *testing.T) {
	sessionID := models.GenerateSessionID()

	// Verify it's a valid UUID
	_, err := uuid.Parse(sessionID)
	assert.NoError(t, err)

	// Verify uniqueness
	sessionID2 := models.GenerateSessionID()
	assert.NotEqual(t, sessionID, sessionID2)
}
