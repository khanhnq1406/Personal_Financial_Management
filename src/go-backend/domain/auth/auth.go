package auth

import (
	"context"
	"fmt"
	"log"
	"time"

	"google.golang.org/api/idtoken"

	"wealthjourney/domain/models"
	"wealthjourney/pkg/config"
	"wealthjourney/pkg/database"
	"wealthjourney/pkg/redis"
	authv1 "wealthjourney/protobuf/v1"

	jwt "github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

// UserService interface for user operations
type UserService interface {
	CreateUser(ctx context.Context, email, name, picture string) (*authv1.CreateUserResponse, error)
}

// CategoryService interface for category operations
type CategoryService interface {
	CreateDefaultCategories(ctx context.Context, userID int32) error
}

// Server provides authentication operations
type Server struct {
	db          *database.Database
	rdb         *redis.RedisClient
	cfg         *config.Config
	userSvc     UserService
	categorySvc CategoryService
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
		db:          db,
		rdb:         rdb,
		cfg:         cfg,
		userSvc:     nil, // Set later via SetServices
		categorySvc: nil, // Set later via SetServices
	}
}

// SetServices sets the user and category services after initialization
func (s *Server) SetServices(userSvc UserService, categorySvc CategoryService) {
	s.userSvc = userSvc
	s.categorySvc = categorySvc
}

// UserData represents user information
type UserData struct {
	ID                   int32     `json:"id"`
	Email                string    `json:"email"`
	Name                 string    `json:"name"`
	Picture              string    `json:"picture"`
	PreferredCurrency    string    `json:"preferredCurrency"`
	ConversionInProgress bool      `json:"conversionInProgress"`
	CreatedAt            time.Time `json:"createdAt"`
	UpdatedAt            time.Time `json:"updatedAt"`
}

// userDataToProto converts UserData to proto User
func userDataToProto(data *UserData) *authv1.User {
	if data == nil {
		return nil
	}
	return &authv1.User{
		Id:                   data.ID,
		Email:                data.Email,
		Name:                 data.Name,
		Picture:              data.Picture,
		PreferredCurrency:    data.PreferredCurrency,
		ConversionInProgress: data.ConversionInProgress,
		CreatedAt:            data.CreatedAt.Unix(),
		UpdatedAt:            data.UpdatedAt.Unix(),
	}
}

// Register registers a new user using Google OAuth token
func (s *Server) Register(ctx context.Context, googleToken string) (*authv1.RegisterResponse, error) {
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
		return &authv1.RegisterResponse{
			Success:   true,
			Message:   "User already exists",
			Data: userDataToProto(&UserData{
				ID:                   existingUser.ID,
				Email:                existingUser.Email,
				Name:                 existingUser.Name,
				Picture:              existingUser.Picture,
				PreferredCurrency:    existingUser.PreferredCurrency,
				ConversionInProgress: existingUser.ConversionInProgress,
				CreatedAt:            existingUser.CreatedAt,
				UpdatedAt:            existingUser.UpdatedAt,
			}),
			Timestamp: time.Now().Format(time.RFC3339),
		}, nil
	} else if result.Error != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("database error: %w", result.Error)
	}

	// Create new user using UserService if available (includes default categories creation)
	if s.userSvc != nil {
		createResp, err := s.userSvc.CreateUser(ctx, email, name, picture)
		if err != nil {
			return nil, fmt.Errorf("failed to create user via UserService: %w", err)
		}

		// Convert CreateUserResponse to RegisterResponse
		return &authv1.RegisterResponse{
			Success:   createResp.Success,
			Message:   "User registered successfully",
			Data:      createResp.Data,
			Timestamp: createResp.Timestamp,
		}, nil
	}

	// Fallback: Create user directly in database (without default categories)
	user := models.User{
		Email:   email,
		Name:    name,
		Picture: picture,
	}

	if err := s.db.DB.Create(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Try to create default categories manually if CategoryService is available
	if s.categorySvc != nil {
		if err := s.categorySvc.CreateDefaultCategories(ctx, user.ID); err != nil {
			log.Printf("Warning: Failed to create default categories for user %d (%s): %v", user.ID, email, err)
		}
	}

	return &authv1.RegisterResponse{
		Success:   true,
		Message:   "User registered successfully",
		Data: userDataToProto(&UserData{
			ID:                   user.ID,
			Email:                user.Email,
			Name:                 user.Name,
			Picture:              user.Picture,
			PreferredCurrency:    user.PreferredCurrency,
			ConversionInProgress: user.ConversionInProgress,
			CreatedAt:            user.CreatedAt,
			UpdatedAt:            user.UpdatedAt,
		}),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// Login logs in a user using Google OAuth token
func (s *Server) Login(ctx context.Context, googleToken string) (*authv1.LoginResponse, error) {
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
		return nil, fmt.Errorf("User not found. Please register first")
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

	return &authv1.LoginResponse{
		Success: true,
		Message: "Login successful",
		Data: &authv1.LoginData{
			AccessToken: tokenString,
			Email:       user.Email,
			Fullname:    user.Name,
			Picture:     user.Picture,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// Logout logs out a user and invalidates the token
func (s *Server) Logout(tokenString string) (*authv1.LogoutResponse, error) {
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

	return &authv1.LogoutResponse{
		Success:   true,
		Message:   "Logged out successfully",
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// VerifyAuth verifies the authentication status
func (s *Server) VerifyAuth(tokenString string) (*authv1.VerifyAuthResponse, error) {
	// Parse token
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

	// Verify token is in whitelist
	storedToken, err := s.rdb.GetFromWhitelist(claims.Email)
	if err != nil || storedToken != tokenString {
		return nil, fmt.Errorf("token not found in whitelist")
	}

	// Get user from database
	var user models.User
	result := s.db.DB.Where("email = ?", claims.Email).First(&user)
	if result.Error != nil {
		return nil, fmt.Errorf("user not found")
	}

	userData := &UserData{
		ID:                   user.ID,
		Email:                user.Email,
		Name:                 user.Name,
		Picture:              user.Picture,
		PreferredCurrency:    user.PreferredCurrency,
		ConversionInProgress: user.ConversionInProgress,
		CreatedAt:            user.CreatedAt,
		UpdatedAt:            user.UpdatedAt,
	}

	return &authv1.VerifyAuthResponse{
		Success:   true,
		Message:   "User retrieved successfully",
		Data:      userDataToProto(userData),
		Timestamp: time.Now().Format(time.RFC3339),
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
func (s *Server) GetAuth(ctx context.Context, email string) (*authv1.GetAuthResponse, error) {
	// Get user from database
	var user models.User
	result := s.db.DB.Where("email = ?", email).First(&user)
	if result.Error == gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("user not found")
	} else if result.Error != nil {
		return nil, fmt.Errorf("database error: %w", result.Error)
	}

	return &authv1.GetAuthResponse{
		Success:   true,
		Message:   "User retrieved successfully",
		Data: userDataToProto(&UserData{
			ID:                   user.ID,
			Email:                user.Email,
			Name:                 user.Name,
			Picture:              user.Picture,
			PreferredCurrency:    user.PreferredCurrency,
			ConversionInProgress: user.ConversionInProgress,
			CreatedAt:            user.CreatedAt,
			UpdatedAt:            user.UpdatedAt,
		}),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}
