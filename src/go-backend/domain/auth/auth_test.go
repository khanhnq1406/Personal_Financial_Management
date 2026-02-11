package auth_test

import (
	"testing"
	"time"
	"wealthjourney/domain/auth"

	jwt "github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestJWTClaims_WithSessionID(t *testing.T) {
	sessionID := "test-session-123"
	userID := int32(1)
	email := "test@example.com"

	claims := auth.JWTClaims{
		UserID:    userID,
		Email:     email,
		SessionID: sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	secret := []byte("test-secret")
	tokenString, err := token.SignedString(secret)
	require.NoError(t, err)

	// Parse token
	parsedToken, err := jwt.ParseWithClaims(tokenString, &auth.JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return secret, nil
	})
	require.NoError(t, err)

	// Verify claims
	parsedClaims, ok := parsedToken.Claims.(*auth.JWTClaims)
	require.True(t, ok)
	assert.Equal(t, sessionID, parsedClaims.SessionID)
	assert.Equal(t, userID, parsedClaims.UserID)
	assert.Equal(t, email, parsedClaims.Email)
}

func TestGenerateToken_IncludesSessionID(t *testing.T) {
	// This test will be implemented after we add the generateToken helper
	t.Skip("Will implement after generateToken refactor")
}
