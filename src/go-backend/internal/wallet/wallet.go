package wallet

import (
	"context"
	"fmt"
	"time"

	"wealthjourney/internal/models"
	"wealthjourney/pkg/database"

	"gorm.io/gorm"
)

// Server provides wallet operations
type Server struct {
	db *database.Database
}

// NewServer creates a new wallet server
func NewServer(db *database.Database) *Server {
	return &Server{db: db}
}

// WalletData represents wallet information
type WalletData struct {
	ID         int32     `json:"id"`
	WalletName string    `json:"wallet_name"`
	Balance    float32   `json:"balance"`
	UserID     int32     `json:"user_id"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// WalletResult is the result of wallet operations
type WalletResult struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    *WalletData `json:"data,omitempty"`
}

// WalletsResult is the result of listing wallets
type WalletsResult struct {
	Success bool          `json:"success"`
	Message string        `json:"message"`
	Wallets []*WalletData `json:"wallets,omitempty"`
}

// CreateWallet creates a new wallet for a user
func (s *Server) CreateWallet(ctx context.Context, email string, name string, balance float32) (*WalletResult, error) {
	// Find user by email
	var user models.User
	result := s.db.DB.Where("email = ?", email).First(&user)
	if result.Error == gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("user not found")
	} else if result.Error != nil {
		return nil, fmt.Errorf("database error: %w", result.Error)
	}

	// Create wallet
	wallet := models.Wallet{
		UserID:     user.ID,
		WalletName: name,
		Balance:    int64(balance),
	}

	result = s.db.DB.Create(&wallet)
	if result.Error != nil || result.RowsAffected == 0 {
		return nil, fmt.Errorf("failed to create wallet")
	}

	// Fetch the created wallet with timestamps
	s.db.DB.First(&wallet, wallet.ID)

	return &WalletResult{
		Success: true,
		Message: "Wallet created successfully",
		Data: &WalletData{
			ID:         wallet.ID,
			WalletName: wallet.WalletName,
			Balance:    float32(wallet.Balance),
			UserID:     wallet.UserID,
			CreatedAt:  wallet.CreatedAt,
			UpdatedAt:  wallet.UpdatedAt,
		},
	}, nil
}

// ListWallets lists all wallets for a user
func (s *Server) ListWallets(ctx context.Context, userID int32) (*WalletsResult, error) {
	var wallets []models.Wallet
	result := s.db.DB.Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&wallets)

	if result.Error != nil {
		return nil, fmt.Errorf("database error: %w", result.Error)
	}

	walletList := make([]*WalletData, len(wallets))
	for i, wallet := range wallets {
		walletList[i] = &WalletData{
			ID:         wallet.ID,
			WalletName: wallet.WalletName,
			Balance:    float32(wallet.Balance),
			UserID:     wallet.UserID,
			CreatedAt:  wallet.CreatedAt,
			UpdatedAt:  wallet.UpdatedAt,
		}
	}

	return &WalletsResult{
		Success: true,
		Message: "Wallets retrieved successfully",
		Wallets: walletList,
	}, nil
}

// GetWallet retrieves a wallet by ID
func (s *Server) GetWallet(ctx context.Context, walletID int32) (*WalletResult, error) {
	var wallet models.Wallet
	result := s.db.DB.First(&wallet, walletID)

	if result.Error == gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("wallet not found")
	} else if result.Error != nil {
		return nil, fmt.Errorf("database error: %w", result.Error)
	}

	return &WalletResult{
		Success: true,
		Message: "Wallet retrieved successfully",
		Data: &WalletData{
			ID:         wallet.ID,
			WalletName: wallet.WalletName,
			Balance:    float32(wallet.Balance),
			UserID:     wallet.UserID,
			CreatedAt:  wallet.CreatedAt,
			UpdatedAt:  wallet.UpdatedAt,
		},
	}, nil
}
