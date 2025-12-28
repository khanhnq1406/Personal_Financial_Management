# Client-Server Communication Guide

This guide explains the improved communication patterns between the client and server in the Personal Financial Management application.

## Table of Contents

1. [Overview](#overview)
2. [Server-Side Improvements](#server-side-improvements)
3. [Client-Side Improvements](#client-side-improvements)
4. [API Response Format](#api-response-format)
5. [Error Handling](#error-handling)
6. [Usage Examples](#usage-examples)
7. [Migration Guide](#migration-guide)

---

## Overview

The application now follows industry best practices for client-server communication with:

- **Standardized API responses** - Consistent response structure across all endpoints
- **Global exception handling** - Centralized error handling with proper logging
- **Type safety** - Strong TypeScript types shared between client and server
- **Automatic retries** - Built-in retry logic for failed requests
- **Request validation** - Automatic input validation using class-validator
- **Better error messages** - User-friendly error messages for common scenarios

---

## Server-Side Improvements

### 1. Standardized Response Structure

All API responses now follow a consistent structure:

```typescript
{
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  path: string;
}
```

### 2. Global Exception Filter

Located at [src/wj-server/src/common/filters/all-exceptions.filter.ts](../src/wj-server/src/common/filters/all-exceptions.filter.ts)

- Catches all exceptions globally
- Formats errors consistently
- Logs errors for debugging
- Returns appropriate HTTP status codes

### 3. Response Transform Interceptor

Located at [src/wj-server/src/common/interceptors/transform.interceptor.ts](../src/wj-server/src/common/interceptors/transform.interceptor.ts)

- Automatically wraps successful responses
- Adds timestamp and request path
- Ensures consistent response format

### 4. Global Validation Pipe

Enabled in [main.ts](../src/wj-server/src/main.ts)

- Validates request bodies using DTOs
- Strips unknown properties
- Transforms payloads to DTO instances
- Returns validation errors with field details

### 5. CurrentUser Decorator

Located at [src/wj-server/src/common/decorators/api-response.decorator.ts](../src/wj-server/src/common/decorators/api-response.decorator.ts)

- Extracts authenticated user from request
- Type-safe user information
- Cleaner controller methods

### 6. Refactored Services

Services now:
- Return data instead of manipulating Response objects
- Throw exceptions for errors (400, 404, 500)
- Use proper NestJS patterns
- Are easier to test

### 7. API Versioning

All endpoints now prefixed with `/api`:
- Old: `http://localhost:5000/wallet/list`
- New: `http://localhost:5000/api/wallet/list`

---

## Client-Side Improvements

### 1. Enhanced API Client

Located at [src/wj-client/utils/api-client.ts](../src/wj-client/utils/api-client.ts)

Features:
- Automatic token injection
- Retry logic for failed requests
- Proper error parsing
- Type-safe responses
- Support for GET, POST, PUT, PATCH, DELETE

### 2. Improved React Hooks

Located at [src/wj-client/hooks/useApi.ts](../src/wj-client/hooks/useApi.ts)

#### `useGet<T>(url, options)`
```typescript
const { data, error, isLoading, isError, isSuccess, refetch, reset } = useGet<Wallet[]>(
  '/wallet/list',
  {
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.error('Error:', error),
    enabled: true,
    refetchInterval: 30000, // Optional: poll every 30s
  }
);
```

#### `usePost<T>(url, options)`
```typescript
const { data, error, isLoading, isError, isSuccess, post, reset } = usePost<CreateWalletResponseData>(
  '/wallet/create',
  {
    onSuccess: (data) => console.log('Created:', data),
    onError: (error) => console.error('Error:', error),
  }
);

await post({ name: 'My Wallet', balance: 1000 });
```

#### `useMutation<T>(url, method, options)`
For PUT, PATCH, DELETE operations:
```typescript
const { data, error, isLoading, mutate } = useMutation(
  '/wallet/1',
  'DELETE',
  {
    onSuccess: () => console.log('Deleted'),
  }
);

await mutate();
```

#### `getErrorMessage(error)`
Convert API errors to user-friendly messages:
```typescript
const { error } = useGet('/wallet/list');
if (error) {
  const message = getErrorMessage(error);
  // Displays: "You're not authenticated. Please login." for 401
}
```

### 3. Updated Types

Located at [src/wj-client/types/api.ts](../src/wj-client/types/api.ts)

- All types match server response structure
- Fixed type mismatches (e.g., `user_id` is now `number`)
- Comprehensive documentation

---

## API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Wallets retrieved successfully",
  "data": [
    {
      "id": 1,
      "wallet_name": "Main Wallet",
      "balance": 1000.00,
      "user_id": 1,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/wallet/list"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "name should not be empty"
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/wallet/create"
}
```

---

## Error Handling

### Server-Side

Throw appropriate exceptions in services:

```typescript
// 400 - Bad Request
throw new BadRequestException('Invalid input');

// 401 - Unauthorized
throw new UnauthorizedException('Invalid token');

// 404 - Not Found
throw new NotFoundException('User not found');

// 409 - Conflict
throw new ConflictException('Email already exists');

// 500 - Internal Server Error (default for unhandled)
throw new Error('Database error');
```

### Client-Side

Check for errors in hooks:

```typescript
const { data, error, isLoading } = useGet<Wallet[]>('/wallet/list');

if (isLoading) return <LoadingSpinner />;
if (error) {
  return <ErrorMessage message={getErrorMessage(error)} />;
}
if (data) {
  return <WalletList wallets={data} />;
}
```

---

## Usage Examples

### Example 1: Fetching Wallets

**Before:**
```typescript
const { data: response } = useGet(`${BACKEND_URL}/wallet/list`);
const wallets = response?.data || [];
```

**After:**
```typescript
const { data: wallets, error, isLoading } = useGet<Wallet[]>('/wallet/list');

if (isLoading) return <div>Loading...</div>;
if (error) return <div>{getErrorMessage(error)}</div>;
return <WalletList wallets={wallets || []} />;
```

### Example 2: Creating a Wallet

**Before:**
```typescript
const { post } = usePost(`${BACKEND_URL}/wallet/create`);
await post({ name: 'My Wallet', balance: 1000 });
```

**After:**
```typescript
const { post, error, isSuccess } = usePost<CreateWalletResponseData>(
  '/wallet/create',
  {
    onSuccess: (data) => {
      toast.success('Wallet created!');
      // Redirect or update UI
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  }
);

await post({ name: 'My Wallet', balance: 1000 });
```

### Example 3: Authentication Check

**Before:**
```typescript
const { data: authData } = useGet(shouldFetch ? `${BACKEND_URL}/auth` : null);
```

**After:**
```typescript
const { data: user, error, isLoading } = useGet<AuthUser>(
  token ? '/auth' : null
);

if (isLoading) return <div>Loading...</div>;
if (error) {
  if (error.statusCode === 401) {
    // Redirect to login
  }
  return <div>{getErrorMessage(error)}</div>;
}
return <Dashboard user={user} />;
```

---

## Migration Guide

### Step 1: Update Server Imports

If you have custom endpoints, update to use the new patterns:

```typescript
// Old
import { Res } from '@nestjs/common';
async myMethod(@Res() res: Response) {
  res.status(200).json({ data });
}

// New
async myMethod() {
  return { message: 'Success', data };
}
```

### Step 2: Update Client Imports

```typescript
// Old
import { useGet, usePost } from '@/hooks';

// New (recommended)
import { useGet, usePost, getErrorMessage } from '@/hooks';
import type { ApiResponse } from '@/types/api';
```

### Step 3: Update URLs

```typescript
// Old
const url = `${BACKEND_URL}/wallet/list`;

// New (shorter, uses base URL from api-client)
const url = '/wallet/list';
```

### Step 4: Handle Errors

```typescript
// Old
const { data, error } = useGet(url);
if (error) {
  // Generic error message
}

// New
const { data, error } = useGet<Wallet[]>(url);
if (error) {
  // User-friendly error message based on status code
  showMessage(getErrorMessage(error));
}
```

---

## Best Practices

### Server-Side

1. **Always return consistent structures** - Use the global interceptor
2. **Throw appropriate exceptions** - Use built-in NestJS exceptions
3. **Use DTOs for validation** - Define request schemas with class-validator
4. **Log errors** - Use the Logger service
5. **Avoid Response object** - Let NestJS handle responses

### Client-Side

1. **Use typed hooks** - Always specify generic type parameter
2. **Handle all states** - Check isLoading, isError, isSuccess
3. **Use error messages** - Display getErrorMessage() to users
4. **Provide callbacks** - Use onSuccess/onError for side effects
5. **Use api-client directly** - For complex scenarios, import apiClient

---

## Testing

### Server Tests

```typescript
describe('WalletController', () => {
  it('should return wallets', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/wallet/list')
      .set('Authorization', `Bearer ${token}`);

    expect(response.body).toMatchObject({
      success: true,
      message: expect.any(String),
      data: expect.any(Array),
      timestamp: expect.any(String),
      path: '/api/wallet/list',
    });
  });
});
```

### Client Tests

```typescript
describe('useGet', () => {
  it('should fetch data successfully', async () => {
    const { result } = renderHook(() => useGet<Wallet[]>('/wallet/list'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(expectedWallets);
  });
});
```

---

## Troubleshooting

### Issue: "Cannot read property 'data' of undefined"

**Solution**: Make sure you're handling the loading state:
```typescript
const { data, isLoading } = useGet('/endpoint');
if (isLoading) return <div>Loading...</div>;
// Now it's safe to use data
```

### Issue: "404 Not Found" on all requests

**Solution**: Check that the API URL includes `/api` prefix:
```typescript
// Correct
const url = '/wallet/list';

// Wrong (missing leading slash)
const url = 'wallet/list';
```

### Issue: "Unauthorized" errors

**Solution**: Ensure token is stored in localStorage:
```typescript
localStorage.setItem('token', accessToken);
```

---

## Additional Resources

- [NestJS Exception Filters](https://docs.nestjs.com/exception-filters)
- [NestJS Interceptors](https://docs.nestjs.com/interceptors)
- [NestJS Validation](https://docs.nestjs.com/techniques/validation)
- [React Hooks](https://react.dev/reference/react)
- [TypeScript Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
