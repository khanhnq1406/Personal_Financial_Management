package middleware

import (
	"log"
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"

	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/types"
)

// ErrorHandler is a middleware that handles errors and panics.
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Set a custom error writer in the context
		c.Next()

		// Check for errors
		if len(c.Errors) > 0 {
			err := c.Errors.Last().Err

			// Handle the error based on its type
			if appErr, ok := err.(apperrors.AppError); ok {
				c.JSON(appErr.StatusCode(), types.NewErrorResponse(types.APIError{
					Code:       appErr.Code(),
					Message:    apperrors.GetErrorMessage(err),
					StatusCode: appErr.StatusCode(),
				}))
			} else {
				// Unknown error - don't leak details
				c.JSON(http.StatusInternalServerError, types.NewErrorResponse(types.APIError{
					Code:       "INTERNAL_ERROR",
					Message:    "An unexpected error occurred",
					StatusCode: http.StatusInternalServerError,
				}))
			}

			// Prevent further handlers
			c.Abort()
		}
	}
}

// Recovery is a middleware that recovers from panics.
func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				// Log the panic and stack trace
				log.Printf("PANIC: %v\n%s", r, debug.Stack())

				// Send internal server error
				c.JSON(http.StatusInternalServerError, types.NewErrorResponse(types.APIError{
					Code:       "INTERNAL_ERROR",
					Message:    "An unexpected error occurred",
					StatusCode: http.StatusInternalServerError,
				}))

				// Prevent further handlers
				c.Abort()
			}
		}()

		c.Next()
	}
}
