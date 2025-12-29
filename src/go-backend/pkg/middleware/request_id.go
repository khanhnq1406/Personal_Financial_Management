package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	// RequestIDKey is the context key for the request ID.
	RequestIDKey = "request_id"
	// RequestIDHeader is the header name for the request ID.
	RequestIDHeader = "X-Request-ID"
)

// RequestID is a middleware that adds a unique request ID to each request.
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get existing request ID from header or generate a new one
		requestID := c.GetHeader(RequestIDHeader)
		if requestID == "" {
			requestID = uuid.New().String()
		}

		// Set the request ID in the context
		c.Set(RequestIDKey, requestID)

		// Set the request ID in the response header
		c.Header(RequestIDHeader, requestID)

		c.Next()
	}
}

// GetRequestID retrieves the request ID from the context.
func GetRequestID(c *gin.Context) string {
	if requestID, exists := c.Get(RequestIDKey); exists {
		if id, ok := requestID.(string); ok {
			return id
		}
	}
	return ""
}
