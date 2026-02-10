# Error Handling Security Guide

## Principles

1. **Never expose internal system details to clients**
   - Database connection strings
   - Server hostnames
   - File paths
   - Stack traces
   - Library versions

2. **Log everything server-side, return safe messages client-side**
   - Detailed errors go to server logs for debugging
   - Generic, user-friendly messages to client

3. **Use typed errors with safe messages**
   - Create AppError types with predefined safe messages
   - Wrap underlying errors without exposing cause to client

4. **Defense in depth**
   - Sanitize at error origin (services)
   - Sanitize in middleware
   - Sanitize in frontend (extra layer)

## Backend Patterns

### Creating New Error Types

```go
// Good: Safe, user-friendly message
func NewWalletNotFoundError() AppError {
    return &BaseError{
        code:       "WALLET_NOT_FOUND",
        message:    "wallet not found",  // Safe
        statusCode: http.StatusNotFound,
    }
}

// Good: Wrap cause for logging, but hide from client
func NewDatabaseErrorWithCause(operation string, cause error) AppError {
    return &BaseError{
        code:       "DATABASE_ERROR",
        message:    fmt.Sprintf("failed to %s", operation),  // Generic
        statusCode: http.StatusInternalServerError,
        cause:      cause,  // Logged server-side only
    }
}
```

### Handling Errors in Services

```go
// Good: Wrap database error with safe message
func (s *walletService) GetWallet(id int32) (*Wallet, error) {
    wallet, err := s.repo.GetByID(ctx, id)
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, apperrors.NewNotFoundError("wallet")
        }
        // Don't expose database error details
        return nil, apperrors.NewInternalErrorWithCause("get wallet", err)
    }
    return wallet, nil
}
```

### Returning Errors in Handlers

```go
// Good: Use centralized error handler
func (h *walletHandler) GetWallet(c *gin.Context) {
    wallet, err := h.service.GetWallet(id)
    if err != nil {
        // Log detailed error server-side
        log.Printf("[WALLET] Failed to get wallet %d: %v", id, err)

        // Return safe error to client
        handler.HandleError(c, err)
        return
    }
    handler.Success(c, wallet)
}

// Bad: Expose raw error
func (h *walletHandler) GetWalletBad(c *gin.Context) {
    wallet, err := h.service.GetWallet(id)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})  // UNSAFE
        return
    }
}
```

## Frontend Patterns

### Using Error Sanitizer

```typescript
import { createSafeErrorMessage } from "@/lib/utils/error-sanitizer";

// Good: Sanitize error before display
const mutation = useMutationCreateWallet({
  onError: (error: any) => {
    const safeMessage = createSafeErrorMessage(
      error,
      "Failed to create wallet"  // Fallback
    );
    setErrorMessage(safeMessage);
  },
});
```

### Displaying Errors to Users

```typescript
// Good: Generic message with safe details
{errorMessage && (
  <div className="text-red-600">
    {errorMessage}
  </div>
)}

// Bad: Displaying raw API error
{error && (
  <div>{JSON.stringify(error)}</div>  // Could contain sensitive info
)}
```

## Testing Error Security

### Manual Testing Checklist

- [ ] Database connection failure (stop database)
- [ ] Invalid authentication credentials
- [ ] Malformed JWT tokens
- [ ] Missing authorization headers
- [ ] Invalid input validation
- [ ] Network timeouts
- [ ] Redis connection failure

### Verification Steps

For each error scenario:

1. Trigger the error
2. Check server logs - should contain detailed error
3. Check API response - should contain safe, generic message
4. Check browser console - no sensitive info
5. Check UI display - user-friendly message only

### Example Test

```bash
# Stop database
docker stop postgres

# Try to login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","googleId":"123"}'

# Expected response (NO password, host, or connection details):
{
  "success": false,
  "error": {
    "code": "LOGIN_FAILED",
    "message": "login failed",
    "statusCode": 500
  }
}

# Server logs (detailed error is OK here):
[DATABASE] Connection failed: dial tcp [...]: connection refused
[ERROR] POST /api/auth/login | Status: 500 | Code: LOGIN_FAILED | Cause: database connection failed
```

## Security Review Checklist

When adding new API endpoints:

- [ ] All errors wrapped with AppError types
- [ ] No raw `err.Error()` sent to client
- [ ] Detailed errors logged server-side
- [ ] Handler uses `handler.HandleError()` or typed error responses
- [ ] Frontend forms use error sanitizer
- [ ] Manual testing performed for error cases
- [ ] No sensitive information in error responses

## Common Mistakes to Avoid

### ❌ Bad Patterns

```go
// Exposing raw errors
c.JSON(500, gin.H{"error": err.Error()})

// Logging sensitive data
log.Printf("User password: %s", password)

// Including stack traces in responses
c.JSON(500, gin.H{"error": err.Error(), "stack": debug.Stack()})
```

### ✅ Good Patterns

```go
// Safe error handling
log.Printf("[AUTH] Login failed: %v", err)
handler.HandleError(c, apperrors.NewLoginErrorWithCause(err))

// Sanitized logging
log.Printf("User authenticated: %s", userEmail)  // No password

// Structured errors
handler.HandleError(c, apperrors.NewValidationError("invalid email format"))
```

## References

- [OWASP Error Handling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)
- [CWE-209: Information Exposure Through Error Message](https://cwe.mitre.org/data/definitions/209.html)
