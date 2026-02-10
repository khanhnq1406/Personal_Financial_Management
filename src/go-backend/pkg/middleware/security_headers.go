package middleware

import (
	"github.com/gin-gonic/gin"
)

// SecurityHeaders adds security-related HTTP headers to all responses.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Prevent information disclosure
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")

		// Remove server identification
		c.Header("Server", "")

		// Content Security Policy
		c.Header("Content-Security-Policy", "default-src 'self'")

		// Referrer policy
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		c.Next()

		// Remove Gin default headers that leak information
		c.Writer.Header().Del("X-Powered-By")
	}
}
