package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"wealthjourney/internal/wallet"
)

// CreateWallet creates a new wallet
func CreateWallet(c *gin.Context) {
	if !checkDatabase(c) {
		return
	}

	// Get user email from context (set by auth middleware)
	userEmail, exists := c.Get("user_email")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": "User not authenticated",
		})
		return
	}

	var req struct {
		Name    string  `json:"name" binding:"required"`
		Balance float32 `json:"balance"`
	}

	if !bindJSON(c, &req) {
		return
	}

	walletServer := wallet.NewServer(deps.DB)
	result, err := walletServer.CreateWallet(c.Request.Context(), userEmail.(string), req.Name, req.Balance)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "creation_failed",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// ListWallets lists all wallets for the authenticated user
func ListWallets(c *gin.Context) {
	if !checkDatabase(c) {
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": "User not authenticated",
		})
		return
	}

	walletServer := wallet.NewServer(deps.DB)
	result, err := walletServer.ListWallets(c.Request.Context(), userID.(int32))

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetWallet retrieves a wallet by ID
func GetWallet(c *gin.Context) {
	if !checkDatabase(c) {
		return
	}

	idStr := c.Param("id")
	walletID, err := strconv.ParseInt(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "Invalid wallet ID",
		})
		return
	}

	walletServer := wallet.NewServer(deps.DB)
	result, err := walletServer.GetWallet(c.Request.Context(), int32(walletID))

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "not_found",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}
