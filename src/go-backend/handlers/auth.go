package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"wealthjourney/domain/auth"
	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/handler"
)

// Register handles user registration with Google OAuth
func Register(c *gin.Context) {
	if !checkDependencies(c) {
		return
	}

	var req struct {
		Token string `json:"token" binding:"required"`
	}

	if !bindJSON(c, &req) {
		return
	}

	// Use the shared auth server instance (with services wired up)
	// If not available, fall back to creating a new instance
	var authServer *auth.Server
	if deps.AuthSrv != nil {
		authServer = deps.AuthSrv
	} else {
		authServer = auth.NewServer(deps.DB, deps.RDB, deps.Cfg)
	}

	result, err := authServer.Register(c.Request.Context(), req.Token)

	if err != nil {
		// Log detailed error server-side for debugging
		log.Printf("[AUTH] Registration failed: %v", err)

		// Return safe error to client
		handler.HandleError(c, apperrors.NewRegistrationErrorWithCause(err))
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
		Token string `json:"token" binding:"required"`
	}

	if !bindJSON(c, &req) {
		return
	}

	// Use the shared auth server instance if available
	var authServer *auth.Server
	if deps.AuthSrv != nil {
		authServer = deps.AuthSrv
	} else {
		authServer = auth.NewServer(deps.DB, deps.RDB, deps.Cfg)
	}
	result, err := authServer.Login(c.Request.Context(), req.Token)

	if err != nil {
		// Log detailed error server-side
		log.Printf("[AUTH] Login failed: %v", err)

		// Return safe error to client
		handler.HandleError(c, apperrors.NewLoginErrorWithCause(err))
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

	// Use the shared auth server instance if available
	var authServer *auth.Server
	if deps.AuthSrv != nil {
		authServer = deps.AuthSrv
	} else {
		authServer = auth.NewServer(deps.DB, deps.RDB, deps.Cfg)
	}
	result, err := authServer.Logout(token)

	if err != nil {
		// Log detailed error server-side
		log.Printf("[AUTH] Logout failed: %v", err)

		// Return safe error to client
		handler.HandleError(c, apperrors.NewLogoutErrorWithCause(err))
		return
	}

	c.JSON(http.StatusOK, result)
}

// VerifyAuth handles authentication verification
//
// NOTE: This endpoint supports token in both Authorization header and query parameter.
// The query parameter fallback is needed for compatibility with the auto-generated
// frontend API client (protobuf-based) which passes tokens as query params for GET requests.
//
// Security considerations:
// - Query parameters are less secure than headers (visible in logs, history, etc.)
// - This is acceptable for /verify because:
//   1. Tokens are short-lived JWT with expiration
//   2. This is a low-risk endpoint (read-only verification)
//   3. Called immediately after login, not stored in browser history
//   4. Other endpoints still require Authorization header
//
// TODO: Consider adding configuration flag to disable query parameter tokens in production
// TODO: Long-term solution: Update protobuf client to use Authorization header for GET requests
func VerifyAuth(c *gin.Context) {
	if !checkDependencies(c) {
		return
	}

	// Try to extract token from Authorization header first (security best practice)
	token, ok := ExtractBearerToken(c)

	// Fallback to query parameter for protobuf client compatibility
	if !ok {
		token = c.Query("token")
		ok = token != ""
	}

	if !ok {
		handler.Unauthorized(c, "No token provided")
		return
	}

	// Use the shared auth server instance if available
	var authServer *auth.Server
	if deps.AuthSrv != nil {
		authServer = deps.AuthSrv
	} else {
		authServer = auth.NewServer(deps.DB, deps.RDB, deps.Cfg)
	}
	result, err := authServer.VerifyAuth(token)

	if err != nil {
		// Log detailed error server-side
		log.Printf("[AUTH] Token verification failed: %v", err)

		// Return safe error to client
		handler.HandleError(c, apperrors.NewTokenError("verification"))
		return
	}

	// Return user data wrapped in standard APIResponse format
	c.JSON(http.StatusOK, result)
}

// GetAuth handles GET /auth - returns user information for authenticated user
func GetAuth(c *gin.Context) {
	if !checkDependencies(c) {
		return
	}

	// Extract email from context (set by AuthMiddleware)
	userEmail, exists := c.Get("user_email")
	if !exists {
		handler.UnauthorizedWithPath(c, "User not authenticated")
		return
	}

	email := userEmail.(string)

	// Use the shared auth server instance if available
	var authServer *auth.Server
	if deps.AuthSrv != nil {
		authServer = deps.AuthSrv
	} else {
		authServer = auth.NewServer(deps.DB, deps.RDB, deps.Cfg)
	}
	userData, err := authServer.GetAuth(c.Request.Context(), email)

	if err != nil {
		handler.NotFoundWithPath(c, err.Error())
		return
	}

	// Return response using the standard format with success, data, message, timestamp, and path
	handler.SuccessWithPath(c, gin.H{
		"id":                   userData.Data.Id,
		"email":                userData.Data.Email,
		"name":                 userData.Data.Name,
		"picture":              userData.Data.Picture,
		"preferredCurrency":    userData.Data.PreferredCurrency,
		"conversionInProgress": userData.Data.ConversionInProgress,
	})
}
