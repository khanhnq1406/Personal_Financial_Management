package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"wealthjourney/internal/auth"
)

// Register handles user registration with Google OAuth
func Register(c *gin.Context) {
	if !checkDependencies(c) {
		return
	}

	var req struct {
		GoogleToken string `json:"google_token" binding:"required"`
	}

	if !bindJSON(c, &req) {
		return
	}

	authServer := auth.NewServer(deps.DB, deps.RDB, deps.Cfg)
	result, err := authServer.Register(c.Request.Context(), req.GoogleToken)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "registration_failed",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// Login handles user login with Google OAuth
func Login(c *gin.Context) {
	if !checkDependencies(c) {
		return
	}

	var req struct {
		GoogleToken string `json:"google_token" binding:"required"`
	}

	if !bindJSON(c, &req) {
		return
	}

	authServer := auth.NewServer(deps.DB, deps.RDB, deps.Cfg)
	result, err := authServer.Login(c.Request.Context(), req.GoogleToken)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "login_failed",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// Logout handles user logout
func Logout(c *gin.Context) {
	if !checkRedis(c) {
		return
	}

	token := c.GetHeader("Authorization")
	if token == "" {
		// Try to get from body
		var req struct {
			Token string `json:"token"`
		}
		c.ShouldBindJSON(&req)
		token = req.Token
	} else {
		// Use ExtractBearerToken for header tokens
		extractedToken, ok := ExtractBearerToken(c)
		if !ok {
			return
		}
		token = extractedToken
	}

	authServer := auth.NewServer(deps.DB, deps.RDB, deps.Cfg)
	result, err := authServer.Logout(token)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "logout_failed",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// VerifyAuth handles authentication verification
func VerifyAuth(c *gin.Context) {
	if !checkDependencies(c) {
		return
	}

	token, ok := ExtractBearerToken(c)
	if !ok {
		return
	}

	authServer := auth.NewServer(deps.DB, deps.RDB, deps.Cfg)
	result, _, err := authServer.VerifyAuth(token)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}
