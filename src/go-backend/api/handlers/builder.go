package handlers

import (
	"github.com/gin-gonic/gin"

	"wealthjourney/internal/service"
)

// AllHandlers contains all handler instances.
type AllHandlers struct {
	Wallet *WalletHandlers
	User   *UserHandlers
	Auth   *AuthHandlers
}

// NewHandlers creates all handler instances with proper dependency injection.
func NewHandlers(services *service.Services) *AllHandlers {
	return &AllHandlers{
		Wallet: &WalletHandlers{walletService: services.Wallet},
		User:   NewUserHandlers(services.User),
		Auth:   NewAuthHandlers(services.User),
	}
}

// UserHandlers handles user-related HTTP requests.
type UserHandlers struct {
	userService service.UserService
}

// NewUserHandlers creates user handlers.
func NewUserHandlers(userService service.UserService) *UserHandlers {
	return &UserHandlers{
		userService: userService,
	}
}

// GetUser retrieves a user by ID.
func (h *UserHandlers) GetUser(c *gin.Context) {
	// Implementation to be added
	// This will follow the same pattern as WalletHandlers
}

// AuthHandlers handles authentication-related HTTP requests.
type AuthHandlers struct {
	userService service.UserService
}

// NewAuthHandlers creates auth handlers.
func NewAuthHandlers(userService service.UserService) *AuthHandlers {
	return &AuthHandlers{
		userService: userService,
	}
}
