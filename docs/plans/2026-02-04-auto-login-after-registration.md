# Auto-Login After Registration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** After a user successfully registers via Google OAuth, automatically log them in and redirect to the dashboard instead of showing a success message with a manual redirect to the login page.

**Architecture:**

1. **Backend**: Modify the Register endpoint to return an access token (like Login does) after successful user registration
2. **Frontend**: Update the register page to use the access token and auto-login the user instead of showing a success notification

**Tech Stack:**

- Backend: Go 1.23, JWT tokens, GORM
- Frontend: Next.js 15, React 19, TypeScript 5, Redux Toolkit
- API: Protocol Buffers (auth.proto)

---

## Task 1: Update Protobuf Definition for Register Response

**Files:**

- Modify: `api/protobuf/v1/auth.proto:96-102`

**Step 1: Read the current RegisterResponse definition**

Run: `cat api/protobuf/v1/auth.proto | grep -A 10 "RegisterResponse"`
Expected: Shows current definition with User data but no access token

**Step 2: Update RegisterResponse to include LoginData**

Edit the `RegisterResponse` message to return `LoginData` instead of `User`:

```protobuf
// Register response
message RegisterResponse {
  bool success = 1 [json_name = "success"];
  string message = 2 [json_name = "message"];
  LoginData data = 3 [json_name = "data"];  // Changed from User to LoginData
  string timestamp = 4 [json_name = "timestamp"];
}
```

**Step 3: Generate code from protobuf**

Run: `task proto:all`
Expected: Successfully generates Go and TypeScript code

---

## Task 2: Update Backend Register Implementation

**Files:**

- Modify: `src/go-backend/domain/auth/auth.go:93-179`

**Step 1: Read current Register implementation**

Run: `cat src/go-backend/domain/auth/auth.go | grep -A 90 "func (s \*Server) Register"`
Expected: Shows current implementation that returns User data

**Step 2: Update Register function to generate and return JWT token**

Modify the `Register` function to generate a JWT token after user creation and return `LoginData`:

```go
// Register registers a new user using Google OAuth token
func (s *Server) Register(ctx context.Context, googleToken string) (*authv1.RegisterResponse, error) {
	// Verify Google token
	payload, err := idtoken.Validate(ctx, googleToken, s.cfg.Google.ClientID)
	if err != nil {
		return nil, fmt.Errorf("invalid Google token: %w", err)
	}

	// Extract user info from Google token
	email := payload.Claims["email"].(string)
	name := payload.Claims["name"].(string)
	picture := payload.Claims["picture"].(string)

	var user models.User

	// Check if user already exists
	result := s.db.DB.Where("email = ?", email).First(&user)
	if result.Error == nil {
		// User already exists - generate token and login
		return s.generateLoginResponse(ctx, user)
	} else if result.Error != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("database error: %w", result.Error)
	}

	// Create new user using UserService if available (includes default categories creation)
	if s.userSvc != nil {
		createResp, err := s.userSvc.CreateUser(ctx, email, name, picture)
		if err != nil {
			return nil, fmt.Errorf("failed to create user via UserService: %w", err)
		}

		// Get the created user from database
		if err := s.db.DB.Where("email = ?", email).First(&user).Error; err != nil {
			return nil, fmt.Errorf("failed to retrieve created user: %w", err)
		}
	} else {
		// Fallback: Create user directly in database (without default categories)
		user = models.User{
			Email:   email,
			Name:    name,
			Picture: picture,
		}

		if err := s.db.DB.Create(&user).Error; err != nil {
			return nil, fmt.Errorf("failed to create user: %w", err)
		}

		// Try to create default categories manually if CategoryService is available
		if s.categorySvc != nil {
			if err := s.categorySvc.CreateDefaultCategories(ctx, user.ID); err != nil {
				log.Printf("Warning: Failed to create default categories for user %d (%s): %v", user.ID, email, err)
			}
		}
	}

	// Generate token and return login response for new user
	return s.generateLoginResponse(ctx, user)
}

// generateLoginResponse generates JWT token and returns RegisterResponse with LoginData
func (s *Server) generateLoginResponse(ctx context.Context, user models.User) (*authv1.RegisterResponse, error) {
	// Generate JWT token
	claims := JWTClaims{
		UserID: user.ID,
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.cfg.JWT.Expiration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.cfg.JWT.Secret))
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Store token in Redis whitelist
	if err := s.rdb.AddToWhitelist(user.Email, tokenString); err != nil {
		return nil, fmt.Errorf("failed to store token: %w", err)
	}

	return &authv1.RegisterResponse{
		Success: true,
		Message: "User registered successfully",
		Data: &authv1.LoginData{
			AccessToken: tokenString,
			Email:       user.Email,
			Fullname:    user.Name,
			Picture:     user.Picture,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}
```

**Step 3: Build backend to verify changes**

Run: `task backend:build`
Expected: Build succeeds without errors

**Step 4: Run backend tests**

Run: `go test -short ./domain/auth/...`
Expected: Tests pass (you may need to update tests due to response change)

---

## Task 3: Update Backend Tests for Register Response

**Files:**

- Modify: `src/go-backend/handlers/auth_integration_test.go` (if exists)

**Step 1: Find register tests**

Run: `grep -r "Register" src/go-backend/handlers/*test.go src/go-backend/domain/auth/*test.go 2>/dev/null || echo "No test files found"`

**Step 2: Update test assertions**

If tests exist, update them to assert for `LoginData` instead of `User` in the response:

```go
// Old assertion (if exists)
assert.NotNil(t, resp.Data.User)

// New assertion
assert.NotNil(t, resp.Data.AccessToken)
assert.Equal(t, testEmail, resp.Data.Email)
```

**Step 3: Run tests**

Run: `go test ./... -short`
Expected: All tests pass

---

## Task 4: Update Frontend Register Page to Auto-Login

**Files:**

- Modify: `src/wj-client/app/auth/register/page.tsx`

**Step 1: Read current register page implementation**

Run: `cat src/wj-client/app/auth/register/page.tsx`
Expected: Shows current implementation with success notification

**Step 2: Update register page to handle LoginData response**

Replace the entire register page content with:

```typescript
"use client";
import Link from "next/link";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

import { LOCAL_STORAGE_TOKEN_NAME, routes } from "@/app/constants";
import { store } from "@/redux/store";
import { setAuth } from "@/redux/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/utils/generated/api";
import { updateAuthTokenCache } from "@/utils/api-client";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";

enum RegisterState {
  Start,
  Error,
}

export default function Register() {
  const router = useRouter();
  const [state, setState] = useState(RegisterState.Start);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async (credentialResponse: any) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await api.auth.register({
        token: credentialResponse.credential,
      });

      if (result.data && result.data.data) {
        // Registration successful - extract login data
        const { accessToken, email, fullname, picture } = result.data.data;

        // Store token
        localStorage.setItem(LOCAL_STORAGE_TOKEN_NAME, accessToken);
        updateAuthTokenCache(accessToken);

        // Update Redux store
        store.dispatch(
          setAuth({
            isAuthenticated: true,
            email: email,
            fullname: fullname,
            picture: picture,
          })
        );

        // Redirect to home
        router.push(routes.home);
      } else {
        // Registration failed
        setErrorMessage(result.data?.message || "Registration failed. Please try again.");
        setState(RegisterState.Error);
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Something went wrong. Please try again.");
      setState(RegisterState.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginError = () => {
    setErrorMessage("Google login failed. Please try again.");
    setState(RegisterState.Error);
  };

  const handleRetry = () => {
    setErrorMessage("");
    setState(RegisterState.Start);
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative px-4 sm:px-6">
      {state === RegisterState.Start ? (
        <div className="flex justify-center items-center flex-col w-full">
          <div className="w-full max-w-md sm:max-w-lg px-4 sm:px-0">
            <p className="text-2xl sm:text-3xl font-extrabold my-1 mb-3">
              Get Started for Free
            </p>
            <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
              <GoogleOAuthProvider
                clientId={
                  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== undefined
                    ? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
                    : ""
                }
              >
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={handleGoogleLoginError}
                  text="signup_with"
                />
              </GoogleOAuthProvider>
            </div>
            {isLoading && (
              <div className="my-3">
                <LoadingSpinner text="Creating account..." />
              </div>
            )}
            {errorMessage && (
              <div className="my-3 text-red-500">
                <p>{errorMessage}</p>
              </div>
            )}
            <p className="my-2 text-sm sm:text-base">
              Already a member?{" "}
              <Link className="underline font-bold" href={routes.login}>
                Login
              </Link>
            </p>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center flex-col w-full max-w-md px-4">
          <div className="text-red-500 mb-4">
            <p className="text-xl font-bold">Registration Failed</p>
            <p className="my-2">{errorMessage}</p>
          </div>
          <button
            className="custom-btn"
            onClick={handleRetry}
          >
            Try Again
          </button>
          <p className="my-4 text-sm">
            Already a member?{" "}
            <Link className="underline font-bold" href={routes.login}>
              Login
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Build frontend to verify changes**

Run: `task frontend:build` or `npm run build` from `src/wj-client`
Expected: Build succeeds without TypeScript errors

---

## Task 5: Remove Unused Notification Component Import (Optional Cleanup)

**Files:**

- Modify: `src/wj-client/app/auth/register/page.tsx`

**Step 1: Verify Notification component is not used elsewhere**

Run: `grep -r "Notification" src/wj-client/app/auth/ | grep -v node_modules`
Expected: Only shows import in register page

**Step 2: Clean up is already done**

The new implementation doesn't use the Notification component, so no additional cleanup needed.

---

## Task 6: Manual Testing

**Step 1: Start backend**

Run: `task dev:backend`
Expected: Backend starts on port 8080 (or configured port)

**Step 2: Start frontend**

Run: `task dev:frontend` (in separate terminal)
Expected: Frontend starts on localhost:3000

**Step 3: Test registration flow**

1. Open browser to `http://localhost:3000/auth/register`
2. Click "Sign up with Google"
3. Complete Google OAuth flow
4. Expected: User is automatically redirected to dashboard (`/dashboard/home`) and is logged in

**Step 4: Test existing user registration**

1. Logout if logged in
2. Go to register page with an already registered Google account
3. Click "Sign up with Google"
4. Expected: User is automatically logged in and redirected to dashboard

**Step 5: Test error handling**

1. Stop backend server
2. Try to register
3. Expected: Error message is displayed with "Try Again" button

---

## Task 7: Update Documentation

**Files:**

- Modify: `.claude/CLAUDE.md` (if auth flow is documented)

**Step 1: Check if auth flow is documented**

Run: `grep -n "register" .claude/CLAUDE.md | head -5`
Expected: May show auth-related documentation

**Step 2: Update documentation if needed**

If the auth flow is documented, update it to reflect auto-login after registration.

---

## Testing Checklist

- [ ] Backend builds successfully
- [ ] Frontend builds successfully
- [ ] New user registration auto-logs in and redirects to dashboard
- [ ] Existing user "registration" auto-logs in and redirects to dashboard
- [ ] Error handling works correctly
- [ ] Token is stored in localStorage
- [ ] Redux store is updated with user info
- [ ] Backend tests pass (if they exist)

---

## Rollback Plan

If issues arise:

1. **Backend rollback**: Revert protobuf and backend changes

   ```bash
   git revert <commit-hash>
   task proto:all
   ```

2. **Frontend rollback**: Revert register page changes
   ```bash
   git checkout HEAD~1 -- src/wj-client/app/auth/register/page.tsx
   ```

---

**Notes:**

- The implementation reuses the existing `LoginData` message to avoid code duplication
- The `generateLoginResponse` helper function is extracted to follow DRY principles
- Both new and existing users will be auto-logged in after "registration" (existing users will simply be logged in)
