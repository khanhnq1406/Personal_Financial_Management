package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"wealthjourney/pkg/config"
	"wealthjourney/pkg/database"
	"wealthjourney/pkg/redis"
)

// Dependencies holds shared dependencies for handlers
type Dependencies struct {
	DB  *database.Database
	RDB *redis.RedisClient
	Cfg *config.Config
}

var deps *Dependencies

// SetDependencies sets the dependencies for handlers
func SetDependencies(db *database.Database, cfg *config.Config) {
	deps = &Dependencies{
		DB:  db,
		Cfg: cfg,
	}
}

// SetRedis sets the Redis client
func SetRedis(rdb *redis.RedisClient) {
	if deps != nil {
		deps.RDB = rdb
	}
}

// GetDependencies returns the current dependencies
func GetDependencies() *Dependencies {
	return deps
}

// Helper functions for common handler operations

// checkDatabase verifies database is configured and responds with error if not
// Returns true if database is available, false otherwise
func checkDatabase(c *gin.Context) bool {
	if deps == nil || deps.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "service_unavailable",
			"message": "Database not configured",
		})
		return false
	}
	return true
}

// checkRedis verifies Redis is configured and responds with error if not
// Returns true if Redis is available, false otherwise
func checkRedis(c *gin.Context) bool {
	if deps == nil || deps.RDB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "service_unavailable",
			"message": "Redis not configured",
		})
		return false
	}
	return true
}

// checkDependencies verifies both database and Redis are configured
// Returns true if both are available, false otherwise
func checkDependencies(c *gin.Context) bool {
	if deps == nil || deps.DB == nil || deps.RDB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "service_unavailable",
			"message": "Database or Redis not configured",
		})
		return false
	}
	return true
}

// ExtractBearerToken extracts the Bearer token from the Authorization header
// Returns the token without the "Bearer " prefix, or an error if missing/invalid
func ExtractBearerToken(c *gin.Context) (string, bool) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": "Missing authorization header",
		})
		return "", false
	}

	// Remove "Bearer " prefix
	token := strings.TrimPrefix(authHeader, "Bearer ")
	if token == authHeader {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": "Invalid authorization format. Use: Bearer <token>",
		})
		return "", false
	}

	return token, true
}

// bindJSON binds JSON request body and handles validation errors
// Returns true if binding succeeded, false otherwise
func bindJSON(c *gin.Context, obj interface{}) bool {
	if err := c.ShouldBindJSON(obj); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": err.Error(),
		})
		return false
	}
	return true
}
