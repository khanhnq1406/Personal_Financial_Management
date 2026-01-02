package auth

import (
	"context"
	"fmt"
	"time"

	"google.golang.org/api/idtoken"

	"wealthjourney/domain/models"
	"wealthjourney/pkg/config"
	"wealthjourney/pkg/database"
	"wealthjourney/pkg/redis"

	jwt "github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

// Server provides authentication operations
type Server struct {
	db  *database.Database
	rdb *redis.RedisClient
	cfg *config.Config
}

// JWTClaims represents JWT token claims
type JWTClaims struct {
	UserID int32  `json:"userId"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// NewServer creates a new auth server
func NewServer(db *database.Database, rdb *redis.RedisClient, cfg *config.Config) *Server {
	return &Server{
		db:  db,
		rdb: rdb,
		cfg: cfg,
	}
}

// UserData represents user information
type UserData struct {
	ID        int32     `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Picture   string    `json:"picture"`
	CreatedAt time.Time `json:"createdAt"`
}

// LoginData contains login information including token
type LoginData struct {
	AccessToken string `json:"accessToken"`
	Email       string `json:"email"`
	Fullname    string `json:"fullname"`
	Picture     string `json:"picture"`
}

// RegisterResult is the result of registration
type RegisterResult struct {
	Success bool      `json:"success"`
	Message string    `json:"message"`
	Data    *UserData `json:"data,omitempty"`
}

// LoginResult is the result of login
type LoginResult struct {
	Success bool       `json:"success"`
	Message string     `json:"message"`
	Data    *LoginData `json:"data,omitempty"`
}

// LogoutResult is the result of logout
type LogoutResult struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// VerifyAuthResult is the result of auth verification
type VerifyAuthResult struct {
	Success bool      `json:"success"`
	Message string    `json:"message"`
	Data    *UserData `json:"data,omitempty"`
}

// Register registers a new user using Google OAuth token
func (s *Server) Register(ctx context.Context, googleToken string) (*RegisterResult, error) {
	// Verify Google token
	payload, err := idtoken.Validate(ctx, googleToken, s.cfg.Google.ClientID)
	if err != nil {
		return nil, fmt.Errorf("invalid Google token: %w", err)
	}

	// Extract user info from Google token
	email := payload.Claims["email"].(string)
	name := payload.Claims["name"].(string)
	picture := payload.Claims["picture"].(string)

	// Check if user already exists
	var existingUser models.User
	result := s.db.DB.Where("email = ?", email).First(&existingUser)
	if result.Error == nil {
		// User already exists
		return &RegisterResult{
			Success: true,
			Message: "User already exists",
			Data: &UserData{
				ID:        existingUser.ID,
				Email:     existingUser.Email,
				Name:      existingUser.Name,
				Picture:   existingUser.Picture,
				CreatedAt: existingUser.CreatedAt,
			},
		}, nil
	} else if result.Error != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("database error: %w", result.Error)
	}

	// Create new user
	user := models.User{
		Email:   email,
		Name:    name,
		Picture: picture,
	}

	if err := s.db.DB.Create(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return &RegisterResult{
		Success: true,
		Message: "User registered successfully",
		Data: &UserData{
			ID:        user.ID,
			Email:     user.Email,
			Name:      user.Name,
			Picture:   user.Picture,
			CreatedAt: user.CreatedAt,
		},
	}, nil
}

// Login logs in a user using Google OAuth token
func (s *Server) Login(ctx context.Context, googleToken string) (*LoginResult, error) {
	// Verify Google token
	payload, err := idtoken.Validate(ctx, googleToken, s.cfg.Google.ClientID)
	if err != nil {
		return nil, fmt.Errorf("invalid Google token: %w", err)
	}

	// Extract email from Google token
	email := payload.Claims["email"].(string)

	// Find user in database
	var user models.User
	result := s.db.DB.Where("email = ?", email).First(&user)
	if result.Error == gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("user not found. Please register first")
	} else if result.Error != nil {
		return nil, fmt.Errorf("database error: %w", result.Error)
	}

	// Generate JWT token
	claims := JWTClaims{
		UserID: user.ID,
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.cfg.JWT.Expiration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.cfg.JWT.Secret))
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Store token in Redis whitelist
	if err := s.rdb.AddToWhitelist(email, tokenString); err != nil {
		return nil, fmt.Errorf("failed to store token: %w", err)
	}

	return &LoginResult{
		Success: true,
		Message: "Login successful",
		Data: &LoginData{
			AccessToken: tokenString,
			Email:       user.Email,
			Fullname:    user.Name,
			Picture:     user.Picture,
		},
	}, nil
}

// Logout logs out a user and invalidates the token
func (s *Server) Logout(tokenString string) (*LogoutResult, error) {
	// Parse token to get email
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.cfg.JWT.Secret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	// Remove token from Redis whitelist
	if err := s.rdb.RemoveFromWhitelist(claims.Email); err != nil {
		return nil, fmt.Errorf("failed to logout: %w", err)
	}

	return &LogoutResult{
		Success: true,
		Message: "Logged out successfully",
	}, nil
}

// VerifyAuth verifies the authentication status
func (s *Server) VerifyAuth(tokenString string) (*VerifyAuthResult, *UserData, error) {
	// Parse token
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.cfg.JWT.Secret), nil
	})
	if err != nil {
		return nil, nil, fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, nil, fmt.Errorf("invalid token claims")
	}

	// Verify token is in whitelist
	storedToken, err := s.rdb.GetFromWhitelist(claims.Email)
	if err != nil || storedToken != tokenString {
		return nil, nil, fmt.Errorf("token not found in whitelist")
	}

	// Get user from database
	var user models.User
	result := s.db.DB.Where("email = ?", claims.Email).First(&user)
	if result.Error != nil {
		return nil, nil, fmt.Errorf("user not found")
	}

	return &VerifyAuthResult{
			Success: true,
			Message: "User retrieved successfully",
			Data: &UserData{
				ID:        user.ID,
				Email:     user.Email,
				Name:      user.Name,
				Picture:   user.Picture,
				CreatedAt: user.CreatedAt,
			},
		}, &UserData{
			ID:        user.ID,
			Email:     user.Email,
			Name:      user.Name,
			Picture:   user.Picture,
			CreatedAt: user.CreatedAt,
		}, nil
}

// ParseToken parses a JWT token and returns the claims
func (s *Server) ParseToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.cfg.JWT.Secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}

// GetAuth retrieves user information by email
func (s *Server) GetAuth(ctx context.Context, email string) (*VerifyAuthResult, error) {
	// Get user from database
	var user models.User
	result := s.db.DB.Where("email = ?", email).First(&user)
	if result.Error == gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("user not found")
	} else if result.Error != nil {
		return nil, fmt.Errorf("database error: %w", result.Error)
	}

	return &VerifyAuthResult{
		Success: true,
		Message: "User retrieved successfully",
		Data: &UserData{
			ID:        user.ID,
			Email:     user.Email,
			Name:      user.Name,
			Picture:   user.Picture,
			CreatedAt: user.CreatedAt,
		},
	}, nil
}
