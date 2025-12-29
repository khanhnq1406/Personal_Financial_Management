package user

import (
	"context"
	"fmt"
	"time"

	"wealthjourney/internal/models"
	"wealthjourney/pkg/database"
	"gorm.io/gorm"
)

// Server provides user operations
type Server struct {
	db *database.Database
}

// NewServer creates a new user server
func NewServer(db *database.Database) *Server {
	return &Server{db: db}
}

// UserData represents user information
type UserData struct {
	ID        int32     `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Picture   string    `json:"picture"`
	CreatedAt time.Time `json:"created_at"`
}

// UserResult is the result of user operations
type UserResult struct {
	Success bool     `json:"success"`
	Message string   `json:"message"`
	Data    *UserData `json:"data,omitempty"`
}

// UsersResult is the result of listing users
type UsersResult struct {
	Success bool       `json:"success"`
	Message string     `json:"message"`
	Users   []*UserData `json:"users,omitempty"`
}

// CreateUserResult is the result of creating a user
type CreateUserResult struct {
	Success     bool   `json:"success"`
	Message     string `json:"message"`
	AffectedRows int32  `json:"affected_rows,omitempty"`
	InsertID    int32  `json:"insert_id,omitempty"`
}

// GetUserByEmail retrieves a user by email
func (s *Server) GetUserByEmail(ctx context.Context, email string) (*UserResult, error) {
	var user models.User
	result := s.db.DB.Where("email = ?", email).First(&user)

	if result.Error == gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("user not found")
	} else if result.Error != nil {
		return nil, fmt.Errorf("database error: %w", result.Error)
	}

	return &UserResult{
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

// GetAllUsers retrieves all users
func (s *Server) GetAllUsers(ctx context.Context) (*UsersResult, error) {
	var users []models.User
	result := s.db.DB.Find(&users)

	if result.Error != nil {
		return nil, fmt.Errorf("database error: %w", result.Error)
	}

	userList := make([]*UserData, len(users))
	for i, user := range users {
		userList[i] = &UserData{
			ID:        user.ID,
			Email:     user.Email,
			Name:      user.Name,
			Picture:   user.Picture,
			CreatedAt: user.CreatedAt,
		}
	}

	return &UsersResult{
		Success: true,
		Message: "Users retrieved successfully",
		Users:   userList,
	}, nil
}

// CreateUser creates a new user
func (s *Server) CreateUser(ctx context.Context, email, name, picture string) (*CreateUserResult, error) {
	user := models.User{
		Email:   email,
		Name:    name,
		Picture: picture,
	}

	result := s.db.DB.Create(&user)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to create user: %w", result.Error)
	}

	return &CreateUserResult{
		Success:     true,
		Message:     "User created successfully",
		AffectedRows: int32(result.RowsAffected),
		InsertID:    user.ID,
	}, nil
}

// FindUserByEmail finds a user by email (internal helper)
func (s *Server) FindUserByEmail(email string) (*models.User, error) {
	var user models.User
	result := s.db.DB.Where("email = ?", email).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}
