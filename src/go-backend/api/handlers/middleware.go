package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"wealthjourney/domain/auth"
)

// AuthMiddleware validates JWT tokens from Redis whitelist
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !checkRedis(c) {
			c.Abort()
			return
		}

		// Extract token using helper function
		token, ok := ExtractBearerToken(c)
		if !ok {
			c.Abort()
			return
		}

		// Verify token using auth service
		authServer := auth.NewServer(deps.DB, deps.RDB, deps.Cfg)
		result, err := authServer.VerifyAuth(token)

		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Store user info in context
		c.Set("user_id", result.Data.Id)
		c.Set("user_email", result.Data.Email)
		c.Set("user_name", result.Data.Name)

		c.Next()
	}
}
