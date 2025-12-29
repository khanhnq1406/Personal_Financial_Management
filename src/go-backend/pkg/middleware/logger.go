package middleware

import (
	"fmt"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// LoggerConfig holds configuration for the logger middleware.
type LoggerConfig struct {
	// SkipPaths is a list of paths to skip logging
	SkipPaths []string
}

// DefaultLoggerConfig returns the default logger configuration.
func DefaultLoggerConfig() LoggerConfig {
	return LoggerConfig{
		SkipPaths: []string{"/health"},
	}
}

// Logger is a middleware that logs HTTP requests.
func Logger(config LoggerConfig) gin.HandlerFunc {
	skipPaths := make(map[string]bool)
	for _, path := range config.SkipPaths {
		skipPaths[path] = true
	}

	return func(c *gin.Context) {
		// Skip logging for specified paths
		if skipPaths[c.Request.URL.Path] {
			c.Next()
			return
		}

		start := time.Now()
		path := c.Request.URL.Path
		requestID := GetRequestID(c)
		if requestID == "" {
			requestID = uuid.New().String()[:8]
		}

		// Process request
		c.Next()

		// Calculate latency
		latency := time.Since(start)

		// Get status code
		status := c.Writer.Status()

		// Get client IP
		clientIP := c.ClientIP()

		// Get user ID if authenticated
		userID := ""
		if uid, exists := c.Get("user_id"); exists {
			userID = fmt.Sprintf("user:%v ", uid)
		}

		// Log the request
		log.Printf("[%s] %s %s %s %s %d %v",
			requestID,
			c.Request.Method,
			path,
			clientIP,
			userID,
			status,
			latency,
		)
	}
}

// RequestLogger returns a simple logger middleware.
func RequestLogger() gin.HandlerFunc {
	return Logger(DefaultLoggerConfig())
}
