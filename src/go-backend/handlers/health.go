package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// DatabaseHealth interface defines methods needed for health checks
type DatabaseHealth interface {
	Ping() error
	Stats() map[string]interface{}
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string         `json:"status"`    // "healthy" or "unhealthy"
	Timestamp time.Time      `json:"timestamp"` // Current time
	Database  DatabaseStatus `json:"database"`  // Database health details
	Uptime    string         `json:"uptime"`    // Server uptime
}

// DatabaseStatus represents database health details
type DatabaseStatus struct {
	Status string                 `json:"status"` // "connected" or "disconnected"
	Stats  map[string]interface{} `json:"stats,omitempty"`
	Error  string                 `json:"error,omitempty"`
}

var serverStartTime = time.Now()

// HealthHandler returns a health check endpoint handler
func HealthHandler(db DatabaseHealth) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Perform database ping
		dbStatus := DatabaseStatus{
			Status: "connected",
		}

		if err := db.Ping(); err != nil {
			dbStatus.Status = "disconnected"
			dbStatus.Error = err.Error()

			c.JSON(http.StatusServiceUnavailable, HealthResponse{
				Status:    "unhealthy",
				Timestamp: time.Now(),
				Database:  dbStatus,
				Uptime:    time.Since(serverStartTime).String(),
			})
			return
		}

		// Get connection pool stats on success
		dbStatus.Stats = db.Stats()

		c.JSON(http.StatusOK, HealthResponse{
			Status:    "healthy",
			Timestamp: time.Now(),
			Database:  dbStatus,
			Uptime:    time.Since(serverStartTime).String(),
		})
	}
}
