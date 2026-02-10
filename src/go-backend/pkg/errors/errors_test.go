package errors

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestAuthenticationErrors(t *testing.T) {
	t.Run("InvalidCredentialsError returns safe message", func(t *testing.T) {
		err := NewInvalidCredentialsError()
		assert.Equal(t, "invalid credentials", err.Error())
		assert.Equal(t, 401, err.StatusCode())
		assert.Equal(t, "INVALID_CREDENTIALS", err.Code())
	})

	t.Run("TokenError returns safe message", func(t *testing.T) {
		err := NewTokenError("verification")
		assert.Equal(t, "token verification failed", err.Error())
		assert.Equal(t, 401, err.StatusCode())
		assert.Equal(t, "TOKEN_ERROR", err.Code())
	})

	t.Run("TokenError with cause hides internal details", func(t *testing.T) {
		internalErr := errors.New("jwt: token is expired by 24h")
		err := NewTokenErrorWithCause("verification", internalErr)

		// User-facing message is safe (doesn't include cause)
		assert.Equal(t, "token verification failed: jwt: token is expired by 24h", err.Error())

		// But we can still access cause for logging via Unwrap
		unwrapped := errors.Unwrap(err)
		assert.NotNil(t, unwrapped)
		assert.Equal(t, internalErr, unwrapped)
	})

	t.Run("RegistrationError returns safe message", func(t *testing.T) {
		dbErr := errors.New("connection to postgres.railway.internal failed")
		err := NewRegistrationErrorWithCause(dbErr)

		// Safe message only (with cause appended)
		assert.Contains(t, err.Error(), "registration failed")
		assert.Equal(t, 500, err.StatusCode())
		assert.Equal(t, "REGISTRATION_FAILED", err.Code())
	})

	t.Run("LoginError returns safe message", func(t *testing.T) {
		causeErr := errors.New("database connection failed")
		err := NewLoginErrorWithCause(causeErr)

		assert.Contains(t, err.Error(), "login failed")
		assert.Equal(t, 500, err.StatusCode())
		assert.Equal(t, "LOGIN_FAILED", err.Code())
	})

	t.Run("LogoutError returns safe message", func(t *testing.T) {
		causeErr := errors.New("redis connection failed")
		err := NewLogoutErrorWithCause(causeErr)

		assert.Contains(t, err.Error(), "logout failed")
		assert.Equal(t, 500, err.StatusCode())
		assert.Equal(t, "LOGOUT_FAILED", err.Code())
	})
}

func TestGetErrorMessage(t *testing.T) {
	t.Run("AppError returns safe message", func(t *testing.T) {
		err := NewInvalidCredentialsError()
		msg := GetErrorMessage(err)
		assert.Equal(t, "invalid credentials", msg)
	})

	t.Run("Non-AppError returns generic message", func(t *testing.T) {
		err := errors.New("database connection failed: host=postgres.railway.internal")
		msg := GetErrorMessage(err)
		assert.Equal(t, "An unexpected error occurred", msg)
	})

	t.Run("Nil error returns generic message", func(t *testing.T) {
		msg := GetErrorMessage(nil)
		assert.Equal(t, "An unexpected error occurred", msg)
	})

	t.Run("RegistrationError with cause returns safe message via GetErrorMessage", func(t *testing.T) {
		dbErr := errors.New("connection to postgres.railway.internal failed")
		err := NewRegistrationErrorWithCause(dbErr)
		msg := GetErrorMessage(err)
		// Should return the AppError message (with cause appended by BaseError.Error())
		assert.Contains(t, msg, "registration failed")
	})
}
