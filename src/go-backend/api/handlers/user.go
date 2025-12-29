package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"wealthjourney/internal/user"
)

// GetAllUsers retrieves all users
func GetAllUsers(c *gin.Context) {
	if !checkDatabase(c) {
		return
	}

	userServer := user.NewServer(deps.DB)
	result, err := userServer.GetAllUsers(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetUserByEmail retrieves a user by email
func GetUserByEmail(c *gin.Context) {
	if !checkDatabase(c) {
		return
	}

	email := c.Param("email")

	userServer := user.NewServer(deps.DB)
	result, err := userServer.GetUserByEmail(c.Request.Context(), email)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "not_found",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// CreateUser creates a new user
func CreateUser(c *gin.Context) {
	if !checkDatabase(c) {
		return
	}

	var req struct {
		Email   string `json:"email" binding:"required,email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}

	if !bindJSON(c, &req) {
		return
	}

	userServer := user.NewServer(deps.DB)
	result, err := userServer.CreateUser(c.Request.Context(), req.Email, req.Name, req.Picture)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "creation_failed",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}
