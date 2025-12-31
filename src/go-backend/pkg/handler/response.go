package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/types"
)

// Success sends a successful response with data.
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, types.NewSuccessResponse(data))
}

// Created sends a 201 created response with data.
func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, types.NewSuccessResponse(data))
}

// NoContent sends a 204 no content response.
func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

// BadRequest sends a 400 bad request response.
func BadRequest(c *gin.Context, err error) {
	if appErr, ok := err.(apperrors.AppError); ok {
		c.JSON(http.StatusBadRequest, types.NewErrorResponse(types.APIError{
			Code:       appErr.Code(),
			Message:    appErr.Error(),
			StatusCode: http.StatusBadRequest,
		}))
		return
	}
	c.JSON(http.StatusBadRequest, types.NewErrorResponse(types.APIError{
		Code:       "VALIDATION_ERROR",
		Message:    err.Error(),
		StatusCode: http.StatusBadRequest,
	}))
}

// Unauthorized sends a 401 unauthorized response.
func Unauthorized(c *gin.Context, message string) {
	c.JSON(http.StatusUnauthorized, types.NewErrorResponse(types.APIError{
		Code:       "UNAUTHORIZED",
		Message:    message,
		StatusCode: http.StatusUnauthorized,
	}))
}

// Forbidden sends a 403 forbidden response.
func Forbidden(c *gin.Context, message string) {
	c.JSON(http.StatusForbidden, types.NewErrorResponse(types.APIError{
		Code:       "FORBIDDEN",
		Message:    message,
		StatusCode: http.StatusForbidden,
	}))
}

// NotFound sends a 404 not found response.
func NotFound(c *gin.Context, message string) {
	c.JSON(http.StatusNotFound, types.NewErrorResponse(types.APIError{
		Code:       "NOT_FOUND",
		Message:    message,
		StatusCode: http.StatusNotFound,
	}))
}

// Conflict sends a 409 conflict response.
func Conflict(c *gin.Context, message string) {
	c.JSON(http.StatusConflict, types.NewErrorResponse(types.APIError{
		Code:       "CONFLICT",
		Message:    message,
		StatusCode: http.StatusConflict,
	}))
}

// InternalError sends a 500 internal server error response.
func InternalError(c *gin.Context, err error) {
	// Log the actual error for debugging
	// TODO: Add proper logging

	if appErr, ok := err.(apperrors.AppError); ok {
		c.JSON(appErr.StatusCode(), types.NewErrorResponse(types.APIError{
			Code:       appErr.Code(),
			Message:    apperrors.GetErrorMessage(err),
			StatusCode: appErr.StatusCode(),
		}))
		return
	}

	// Don't leak internal error details
	c.JSON(http.StatusInternalServerError, types.NewErrorResponse(types.APIError{
		Code:       "INTERNAL_ERROR",
		Message:    "An unexpected error occurred",
		StatusCode: http.StatusInternalServerError,
	}))
}

// HandleError handles any error and sends the appropriate response.
func HandleError(c *gin.Context, err error) {
	if err == nil {
		Success(c, nil)
		return
	}

	statusCode := apperrors.GetStatusCode(err)
	switch statusCode {
	case http.StatusBadRequest:
		BadRequest(c, err)
	case http.StatusUnauthorized:
		Unauthorized(c, apperrors.GetErrorMessage(err))
	case http.StatusForbidden:
		Forbidden(c, apperrors.GetErrorMessage(err))
	case http.StatusNotFound:
		NotFound(c, apperrors.GetErrorMessage(err))
	case http.StatusConflict:
		Conflict(c, apperrors.GetErrorMessage(err))
	default:
		InternalError(c, err)
	}
}

// GetUserID retrieves the user ID from the context.
func GetUserID(c *gin.Context) (int32, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}
	id, ok := userID.(int32)
	return id, ok
}

// GetUserEmail retrieves the user email from the context.
func GetUserEmail(c *gin.Context) (string, bool) {
	email, exists := c.Get("user_email")
	if !exists {
		return "", false
	}
	e, ok := email.(string)
	return e, ok
}

// BindAndValidate binds JSON request body and validates it.
func BindAndValidate(c *gin.Context, obj interface{}) error {
	if err := c.ShouldBindJSON(obj); err != nil {
		return apperrors.NewValidationErrorWithCause("invalid request body", err)
	}
	return nil
}

// SuccessWithPath sends a successful response with data and path.
func SuccessWithPath(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, types.NewSuccessResponseWithPath(data, c.Request.URL.Path))
}

// CreatedWithPath sends a 201 created response with data and path.
func CreatedWithPath(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, types.NewSuccessResponseWithPath(data, c.Request.URL.Path))
}

// UnauthorizedWithPath sends a 401 unauthorized response with path.
func UnauthorizedWithPath(c *gin.Context, message string) {
	c.JSON(http.StatusUnauthorized, types.NewErrorResponseWithPath(types.APIError{
		Code:       "UNAUTHORIZED",
		Message:    message,
		StatusCode: http.StatusUnauthorized,
	}, c.Request.URL.Path))
}

// NotFoundWithPath sends a 404 not found response with path.
func NotFoundWithPath(c *gin.Context, message string) {
	c.JSON(http.StatusNotFound, types.NewErrorResponseWithPath(types.APIError{
		Code:       "NOT_FOUND",
		Message:    message,
		StatusCode: http.StatusNotFound,
	}, c.Request.URL.Path))
}
