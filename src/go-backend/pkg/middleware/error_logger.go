package middleware

import (
	"errors"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	apperrors "wealthjourney/pkg/errors"
)

// ErrorLogger logs all errors with full details server-side.
// This runs BEFORE ErrorHandler sanitizes errors for client.
func ErrorLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Record start time
		start := time.Now()

		// Process request
		c.Next()

		// Check for errors
		if len(c.Errors) > 0 {
			for _, err := range c.Errors {
				logError(c, err.Err, start)
			}
		}
	}
}

func logError(c *gin.Context, err error, start time.Time) {
	duration := time.Since(start)

	// Extract request info
	method := c.Request.Method
	path := c.Request.URL.Path
	statusCode := c.Writer.Status()
	userID := c.GetString("user_id") // From auth middleware

	// Check if it's an AppError
	var appErr apperrors.AppError
	if errors.As(err, &appErr) {
		// Log application errors with wrapped cause
		cause := errors.Unwrap(err)
		if cause != nil {
			log.Printf(
				"[ERROR] %s %s | Status: %d | User: %s | Duration: %v | Code: %s | Message: %s | Cause: %v",
				method, path, statusCode, userID, duration,
				appErr.Code(), appErr.Error(), cause,
			)
		} else {
			log.Printf(
				"[ERROR] %s %s | Status: %d | User: %s | Duration: %v | Code: %s | Message: %s",
				method, path, statusCode, userID, duration,
				appErr.Code(), appErr.Error(),
			)
		}
	} else {
		// Log unexpected errors with full details
		log.Printf(
			"[ERROR] %s %s | Status: %d | User: %s | Duration: %v | Unexpected: %v",
			method, path, statusCode, userID, duration, err,
		)
	}
}
