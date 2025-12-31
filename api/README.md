# API Documentation

This directory contains the Protocol Buffer (protobuf) definitions shared between the Go backend and TypeScript frontend, along with tools for generating type-safe code and API clients.

## Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [Protocol Buffer Definitions](#protocol-buffer-definitions)
- [Code Generation](#code-generation)
- [API Endpoints Reference](#api-endpoints-reference)
- [Using Generated Types](#using-generated-types)
- [Backend Implementation Patterns](#backend-implementation-patterns)
- [Frontend Implementation Patterns](#frontend-implementation-patterns)
- [Conventions](#conventions)
- [Common Types](#common-types)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

The WealthJourney application uses Protocol Buffers as the single source of truth for API contracts between the Go backend and TypeScript frontend. The system supports both REST and gRPC protocols.

**Key Benefits:**
1. **Single Source of Truth**: Proto files define your API contract
2. **Type Safety**: Generated types match your proto definitions
3. **No Manual Updates**: When proto changes, regenerate the code
4. **Dual Protocol**: Support for both REST and gRPC
5. **Vercel Compatible**: Uses standard REST API (no gRPC needed for deployment)

## Directory Structure

```
api/
├── protobuf/
│   └── v1/
│       ├── common.proto    # Shared types (Money, Pagination, APIResponse)
│       ├── auth.proto      # Auth service and types
│       ├── user.proto      # User service and types
│       └── wallet.proto    # Wallet service and types
├── scripts/
│   └── generate-rest-api.js  # REST API client generator
├── buf.yaml                # Buf configuration
├── buf.gen.yaml            # TypeScript code generation config
├── buf.gen.go.yaml         # Go code generation config
├── README.md               # This file
├── GENERATOR_README.md     # Legacy: Auto-generator docs (now integrated)
└── GRPC_INTEGRATION.md     # Legacy: gRPC integration docs (now integrated)
```

**Generated Files:**

```
src/go-backend/
└── gen/                    # Generated Go code
    ├── common/v1/
    ├── auth/v1/
    ├── user/v1/
    └── wallet/v1/

src/wj-client/
├── gen/protobuf/v1/        # Generated protobuf types (ts-proto)
│   ├── auth.ts
│   ├── wallet.ts
│   ├── user.ts
│   └── common.ts
└── utils/generated/
    └── api.ts              # Generated REST API client
```

## Prerequisites

### Install Buf CLI

```bash
# macOS/Linux
brew install bufbuild/buf/buf

# Or using go install
go install github.com/bufbuild/buf/cmd/buf@latest

# Verify installation
buf --version
```

### Install TypeScript Protobuf Plugin

```bash
cd src/wj-client
npm install --save-dev ts-proto
```

## Architecture

The application supports both REST and gRPC protocols:

- **REST API**: Traditional JSON-based HTTP API on port 8080
- **gRPC API**: High-performance RPC API on port 50051

Both servers run concurrently and share the same service layer.

```
┌─────────────┐
│   Frontend  │
│ (Next.js)   │
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌───────────┐  ┌──────────┐
│REST :8080 │  │gRPC:50051│
│  Server   │  │  Server  │
└─────┬─────┘  └────┬─────┘
      │             │
      └──────┬──────┘
             ▼
      ┌─────────────┐
      │Service Layer│
      └─────────────┘
```

## Generating Code

### Generate All (Frontend)

```bash
cd src/wj-client
npm run generate:all

# Or run separately
npm run generate:types   # Generate protobuf types with buf
npm run generate:api     # Generate REST API methods from proto
```

### Generate Go Types (Backend)

```bash
cd src/go-backend
make generate-proto
```

Or manually:
```bash
cd api
buf generate --template buf.gen.go.yaml
```

## Using Generated Types

### Frontend (TypeScript)

```typescript
import { Wallet, CreateWalletRequest } from '@/gen/protobuf/v1/wallet';
import { Money } from '@/gen/protobuf/v1/common';

const wallet: Wallet = {
  id: 1,
  userId: 1,
  walletName: "My Wallet",
  balance: { amount: 10000, currency: "USD" },
  // ...
};
```

### Backend (Go)

```go
import (
    walletv1 "wealthjourney/gen/wallet/v1"
    commonv1 "wealthjourney/gen/common/v1"
)

func CreateWallet(req *walletv1.CreateWalletRequest) (*walletv1.Wallet, error) {
    wallet := &walletv1.Wallet{
        WalletName: req.WalletName,
        Balance: req.InitialBalance,
        // ...
    }
    return wallet, nil
}
```

## Auto-Generated REST API Client

### Quick Start

```bash
# Generate both types and API client
npm run generate:all
```

### Usage Example

```typescript
import { api } from "@/utils/generated/api";

// All methods are fully typed from proto definitions
const response = await api.auth.login({ googleToken: "xxx" });
const wallets = await api.wallet.listWallets({ pagination: { page: 1, pageSize: 10 } });
const user = await api.user.getUser({ userId: 123 });
```

### How It Works

1. **Proto Definitions** (`api/protobuf/v1/*.proto`): Define your services in proto files
2. **Type Generation** (`buf.gen.yaml`): ts-proto generates TypeScript types
3. **API Generation** (`api/scripts/generate-rest-api.js`): The generator script:
   - Parses proto files to extract service definitions
   - Maps gRPC methods to REST endpoints
   - Generates type-safe API methods

### Customizing the Generator

Edit `api/scripts/generate-rest-api.js` to:

1. **Add new endpoint mappings**: Update `getHTTPPath()` function
2. **Change field mappings**: Update request body transformation
3. **Modify HTTP method detection**: Update `getHTTPMethod()` function

```javascript
// Example: Add custom endpoint mapping
function getHTTPPath(serviceName, methodName, requestType) {
  if (methodName === "CustomMethod") {
    return `/v1/custom-endpoint`;
  }
  // ... rest of mappings
}
```

## Backend Usage

### Starting the Servers

The main server (`cmd/server/main.go`) starts both REST and gRPC servers:

```bash
# Start both servers (REST on 8080, gRPC on 50051)
cd src/go-backend
make run

# Or with custom ports
GRPC_PORT=50051 make run
```

### gRPC Server Implementation

The gRPC server is implemented in `internal/grpcserver/`:

- `server.go` - Main gRPC server setup
- `auth.go` - AuthService implementation
- `user.go` - UserService implementation
- `wallet.go` - WalletService implementation
- `common.go` - Type conversion utilities

### Adding New RPCs

1. Add the RPC to the `.proto` file in `api/protobuf/v1/`
2. Regenerate code: `make generate-proto`
3. Implement the RPC method in the appropriate server file in `internal/grpcserver/`
4. The server automatically registers all implemented services

## Frontend Usage

### Using the REST API Client (Recommended for Vercel)

```typescript
import { api } from "@/utils/generated/api";

// Make a call
const response = await api.auth.login({ googleToken: "xxx" });
```

### Using the gRPC Client

```typescript
import { createPromiseClient } from "@bufbuild/connect-web";
import { createAuthTransport } from "@/utils/grpc-client";

// Create client
const authClient = createPromiseClient(/* ... */);

// Make a call
const response = await authClient.login({ googleToken: "xxx" });
```

### Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GRPC_URL=http://localhost:50051
```

## gRPC to REST Mapping

| gRPC Method | REST Endpoint | HTTP Method |
|-------------|---------------|-------------|
| `Login` | `/v1/auth/login` | POST |
| `Register` | `/v1/auth/register` | POST |
| `GetWallet` | `/v1/wallets/:id` | GET |
| `ListWallets` | `/v1/wallets?page=1` | GET |
| `CreateWallet` | `/v1/wallets` | POST |
| `UpdateWallet` | `/v1/wallets/:id` | PUT |
| `DeleteWallet` | `/v1/wallets/:id` | DELETE |

## Conventions

- **Field naming**: Use `snake_case` for proto fields (e.g., `wallet_name`, `page_size`)
- **Type naming**: Use `PascalCase` for messages and enums (e.g., `CreateWalletRequest`)
- **Package naming**: Use `wealthjourney.{service}.v1` format
- **Go package**: Maps to `wealthjourney/gen/{service}/v1;{service}v1`
- **TS package**: Maps to `gen/{service}/v1`

## Common Types

### Money
```protobuf
message Money {
  int64 amount = 1;      // Amount in smallest currency unit (cents)
  string currency = 2;   // ISO 4217 currency code (e.g., "USD")
}
```

### Pagination
```protobuf
message PaginationParams {
  int32 page = 1;
  int32 page_size = 2;
  string order_by = 3;
  string order = 4;
}

message PaginationResult {
  int32 page = 1;
  int32 page_size = 2;
  int32 total_count = 3;
  int32 total_pages = 4;
}
```

### API Response
```protobuf
message APIResponse {
  bool success = 1;
  string message = 2;
  map<string, string> metadata = 3;
}
```

## Testing

### Using grpcurl

```bash
# Install grpcurl
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest

# List services
grpcurl -plaintext localhost:50051 list

# Describe service
grpcurl -plaintext localhost:50051 describe wealthjourney.auth.v1.AuthService

# Call RPC
grpcurl -plaintext \
  -d '{"google_token": "test-token"}' \
  localhost:50051 \
  wealthjourney.auth.v1.AuthService/Register
```

### Using grpcui

```bash
go install github.com/fullstorydev/grpcui/cmd/grpcui@latest

# Start web UI
grpcui -plaintext localhost:50051
```

## Troubleshooting

### Generated API has wrong endpoints

Edit `getHTTPPath()` in `generate-rest-api.js` to add your custom mapping.

### Field names don't match REST API

Edit the request body transformation in the method-specific handling section of `generate-rest-api.js`.

### Want different HTTP methods

Edit `getHTTPMethod()` in `generate-rest-api.js` to change the detection logic.

## Workflow

1. **Edit proto file** in `api/protobuf/v1/`
2. **Run `npm run generate:all`** (frontend) or `make generate-proto` (backend)
3. **Use generated code** in your application

```bash
# Edit api/protobuf/v1/wallet.proto
vim api/protobuf/v1/wallet.proto

# Regenerate
npm run generate:all

# Done! Use the new API methods
```

## Protocol Buffer Definitions

The API contracts are defined in [protobuf/v1/](protobuf/v1/) files. These serve as the single source of truth for both REST and gRPC implementations.

### Common Types ([common.proto](protobuf/v1/common.proto))

```protobuf
package wealthjourney.common.v1;

// Monetary amount with currency (in cents)
message Money {
  int64 amount = 1;
  string currency = 2;
}

// Pagination parameters
message PaginationParams {
  int32 page = 1;
  int32 page_size = 2;
  string order_by = 3;
  string order = 4;
}

// Pagination result metadata
message PaginationResult {
  int32 page = 1;
  int32 page_size = 2;
  int32 total_count = 3;
  int32 total_pages = 4;
}

// Standard API response wrapper
message APIResponse {
  bool success = 1;
  string message = 2;
  map<string, string> metadata = 3;
}
```

### AuthService ([auth.proto](protobuf/v1/auth.proto))

```protobuf
package wealthjourney.auth.v1;

service AuthService {
  // Register with Google OAuth token
  rpc Register(RegisterRequest) returns (RegisterResponse);

  // Login with Google OAuth token
  rpc Login(LoginRequest) returns (LoginResponse);

  // Logout and invalidate JWT token
  rpc Logout(LogoutRequest) returns (LogoutResponse);

  // Verify JWT token validity
  rpc VerifyAuth(VerifyAuthRequest) returns (VerifyAuthResponse);

  // Get user by email address
  rpc GetAuth(GetAuthRequest) returns (GetAuthResponse);
}
```

### UserService ([user.proto](protobuf/v1/user.proto))

```protobuf
package wealthjourney.user.v1;

service UserService {
  // Get current authenticated user profile
  rpc GetUser(GetUserRequest) returns (GetUserResponse);

  // Get user by email address
  rpc GetUserByEmail(GetUserByEmailRequest) returns (GetUserByEmailResponse);

  // List all users with pagination
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);

  // Create a new user
  rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);

  // Update user information
  rpc UpdateUser(UpdateUserRequest) returns (UpdateUserResponse);

  // Delete a user
  rpc DeleteUser(DeleteUserRequest) returns (DeleteUserResponse);
}
```

### WalletService ([wallet.proto](protobuf/v1/wallet.proto))

```protobuf
package wealthjourney.wallet.v1;

service WalletService {
  // Get wallet by ID
  rpc GetWallet(GetWalletRequest) returns (GetWalletResponse);

  // List wallets with pagination
  rpc ListWallets(ListWalletsRequest) returns (ListWalletsResponse);

  // Create a new wallet
  rpc CreateWallet(CreateWalletRequest) returns (CreateWalletResponse);

  // Update wallet information
  rpc UpdateWallet(UpdateWalletRequest) returns (UpdateWalletResponse);

  // Delete a wallet
  rpc DeleteWallet(DeleteWalletRequest) returns (DeleteWalletResponse);

  // Add funds to wallet
  rpc AddFunds(AddFundsRequest) returns (AddFundsResponse);

  // Withdraw funds from wallet
  rpc WithdrawFunds(WithdrawFundsRequest) returns (WithdrawFundsResponse);

  // Transfer funds between wallets
  rpc TransferFunds(TransferFundsRequest) returns (TransferFundsResponse);
}
```

## Code Generation

The project uses **Buf** for protobuf management and code generation.

### Configuration Files

#### [buf.yaml](buf.yaml) - Buf Configuration
```yaml
version: v1
breaking:
  use:
    - FILE
lint:
  use:
    - DEFAULT
deps:
  - buf.build/googleapis/googleapis
```

#### [buf.gen.yaml](buf.gen.yaml) - TypeScript Generation
```yaml
version: v1
plugins:
  - plugin: ts-proto
    out: ../src/wj-client/gen
    opt:
      - esModuleInterop=true
      - forceLong=long
      - useOptionals=none
      - outputJsonMethods=true
      - outputPartialMethods=false
      - unrecognizedEnum=true
      - stringEnums=true
```

#### [buf.gen.go.yaml](buf.gen.go.yaml) - Go Generation
```yaml
version: v1
plugins:
  - plugin: buf.build/grpc/go:v1.3.0
    out: ../src/go-backend/gen
    opt: paths=source_relative
  - plugin: buf.build/protocolbuffers/go:v1.31.0
    out: ../src/go-backend/gen
    opt: paths=source_relative
```

### Generate Commands

```bash
# Frontend: Generate TypeScript types and REST client
cd src/wj-client
npm run generate:all    # Both types and API client
npm run generate:types  # Only TypeScript types
npm run generate:api    # Only REST API client

# Backend: Generate Go gRPC and protobuf code
cd src/go-backend
make generate-proto
```

### REST API Generator ([scripts/generate-rest-api.js](scripts/generate-rest-api.js))

The custom REST API generator:
1. **Parses** proto files using regex to extract service definitions
2. **Maps** gRPC method names to HTTP methods based on naming patterns:
   - `Create*/Add*/Register*` → POST
   - `Update*/Set*` → PUT
   - `Delete*/Remove*` → DELETE
   - `List*/Get*/Find*/Verify*` → GET
3. **Generates** TypeScript code with full type safety
4. **Handles** special cases like URL params, query strings, and field mapping

## API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/v1/auth/register` | Register with Google OAuth | No |
| POST | `/v1/auth/login` | Login with Google OAuth | No |
| POST | `/v1/auth/logout` | Logout and invalidate token | Yes |
| GET | `/v1/auth/verify` | Verify JWT token validity | Yes |
| GET | `/v1/auth/by-email` | Get user by email | Yes |

### User Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/v1/users` | Get current user profile | Yes |
| GET | `/v1/users/all` | List all users (paginated) | Yes (Admin) |
| GET | `/v1/users/:email` | Get user by email | Yes |
| POST | `/v1/users` | Create new user | Yes (Admin) |
| PUT | `/v1/users/profile` | Update user profile | Yes |
| DELETE | `/v1/users/:id` | Delete user | Yes (Admin) |

### Wallet Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/v1/wallets` | Create new wallet | Yes |
| GET | `/v1/wallets` | List user's wallets (paginated) | Yes |
| GET | `/v1/wallets/:id` | Get wallet by ID | Yes |
| PUT | `/v1/wallets/:id` | Update wallet | Yes |
| DELETE | `/v1/wallets/:id` | Delete wallet | Yes |
| POST | `/v1/wallets/:id/add` | Add funds to wallet | Yes |
| POST | `/v1/wallets/:id/withdraw` | Withdraw funds | Yes |
| POST | `/v1/wallets/transfer` | Transfer between wallets | Yes |

### Query Parameters

**Pagination parameters** (for LIST endpoints):
```
?page=1&pageSize=10&orderBy=created_at&order=desc
```

## Backend Implementation Patterns

### Project Structure

```
src/go-backend/
├── cmd/server/
│   └── main.go              # Entry point, starts both REST and gRPC servers
├── api/
│   └── handlers/
│       ├── auth.go          # REST handlers for auth
│       ├── routes.go        # Route registration
│       └── middleware.go    # Auth middleware
├── internal/
│   ├── grpcserver/          # gRPC server implementations
│   │   ├── server.go        # gRPC server setup
│   │   ├── auth.go          # AuthService implementation
│   │   ├── user.go          # UserService implementation
│   │   ├── wallet.go        # WalletService implementation
│   │   └── common.go        # Type conversion utilities
│   ├── service/             # Business logic layer
│   │   ├── auth.go          # Auth service
│   │   ├── user.go          # User service
│   │   ├── wallet.go        # Wallet service
│   │   └── dto.go           # Data transfer objects
│   └── models/              # Database models
│       ├── user.go
│       └── wallet.go
└── gen/                     # Generated protobuf code
    ├── auth/v1/
    ├── user/v1/
    └── wallet/v1/
```

### Dual Transport Architecture

The backend supports both REST and gRPC from the same business logic:

```
                    ┌─────────────────┐
                    │   Service Layer │  (Business Logic)
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
        ┌───────▼────────┐      ┌────────▼──────┐
        │  REST Handler  │      │ gRPC Handler  │
        │  (Gin Router)  │      │ (protobuf)    │
        └───────┬────────┘      └────────┬──────┘
                │                         │
        ┌───────▼────────┐      ┌────────▼──────┐
        │  :8080 HTTP    │      │  :50051 gRPC   │
        └────────────────┘      └────────────────┘
```

### Adding a New Endpoint

1. **Add RPC to proto file** ([protobuf/v1/](protobuf/v1/)):
   ```protobuf
   rpc MyNewMethod(MyNewRequest) returns (MyNewResponse);
   ```

2. **Regenerate code**:
   ```bash
   cd src/go-backend && make generate-proto
   ```

3. **Implement in service layer** ([internal/service/](../../src/go-backend/internal/service/)):
   ```go
   func (s *Service) MyNewMethod(ctx context.Context, req DTO) (*Result, error) {
       // Business logic here
   }
   ```

4. **Implement REST handler** ([api/handlers/](../../src/go-backend/api/handlers/)):
   ```go
   func (h *Handlers) MyNewMethod(c *gin.Context) {
       // Parse request, call service, return response
   }
   ```

5. **Implement gRPC handler** ([internal/grpcserver/](../../src/go-backend/internal/grpcserver/)):
   ```go
   func (s *Server) MyNewMethod(ctx context.Context, req *pb.MyNewRequest) (*pb.MyNewResponse, error) {
       // Convert proto to DTO, call service, convert result
   }
   ```

6. **Register REST route** in [routes.go](../../src/go-backend/api/handlers/routes.go):
   ```go
   router.POST("/v1/my-endpoint", h.MyNewMethod)
   ```

## Frontend Implementation Patterns

### Project Structure

```
src/wj-client/
├── gen/protobuf/v1/         # Generated TypeScript types
│   ├── auth.ts              # Auth types
│   ├── user.ts              # User types
│   ├── wallet.ts            # Wallet types
│   └── common.ts            # Common types
├── utils/
│   ├── generated/
│   │   └── api.ts           # Auto-generated REST client
│   ├── api-client.ts        # Manual HTTP client wrapper
│   └── grpc-client.ts       # gRPC client utilities (unused)
├── types/
│   └── api.ts               # Manual API type definitions
└── app/
    └── auth/
        └── utils/
            └── authCheck.tsx  # Auth utilities
```

### Using the Generated API Client

```typescript
import { api } from "@/utils/generated/api";

// Login
const response = await api.auth.login({ googleToken: "xxx" });
// Response type: LoginResponse

// List wallets
const wallets = await api.wallet.listWallets({
  pagination: { page: 1, pageSize: 10 }
});
// Response type: ListWalletsResponse

// Create wallet
const wallet = await api.wallet.createWallet({
  walletName: "My Wallet",
  initialBalance: { amount: 10000, currency: "USD" }
});
// Response type: CreateWalletResponse
```

### Type Safety

All generated types are fully typed from the proto definitions:

```typescript
// From gen/protobuf/v1/wallet.ts
export interface Wallet {
  id: number;
  userId: number;
  walletName: string;
  balance: Money;  // From common types
  createdAt: string;
  updatedAt: string;
}

// From utils/generated/api.ts
export const api = {
  wallet: {
    listWallets: (req: ListWalletsRequest) => Promise<ListWalletsResponse>,
    createWallet: (req: CreateWalletRequest) => Promise<CreateWalletResponse>,
    // ... other methods
  }
};
```

## Conventions

### Naming Conventions

| Context | Convention | Example |
|---------|------------|---------|
| Proto files | kebab-case | `wallet.proto` |
| Proto packages | dot.notation | `wealthjourney.wallet.v1` |
| Proto messages | PascalCase | `CreateWalletRequest` |
| Proto fields | snake_case | `wallet_name`, `page_size` |
| Go packages | lowercase | `wallet/v1` |
| Go structs | PascalCase | `CreateWalletRequest` |
| Go methods | PascalCase | `CreateWallet` |
| TypeScript interfaces | PascalCase | `CreateWalletRequest` |
| TypeScript properties | camelCase | `walletName`, `pageSize` |
| REST endpoints | kebab-case | `/v1/wallets/:id/add` |
| gRPC methods | PascalCase | `CreateWallet` |

### HTTP Method Detection

The REST API generator uses these patterns:

| Pattern | HTTP Method |
|---------|-------------|
| `Create*`, `Add*`, `Register*`, `Transfer*` | POST |
| `Update*`, `Set*` | PUT |
| `Delete*`, `Remove*` | DELETE |
| `List*`, `Get*`, `Find*`, `Verify*` | GET |

## Common Types

### Money
```protobuf
message Money {
  int64 amount = 1;      // Amount in smallest currency unit (cents)
  string currency = 2;   // ISO 4217 currency code (e.g., "USD")
}
```

### Pagination
```protobuf
message PaginationParams {
  int32 page = 1;
  int32 page_size = 2;
  string order_by = 3;
  string order = 4;
}

message PaginationResult {
  int32 page = 1;
  int32 page_size = 2;
  int32 total_count = 3;
  int32 total_pages = 4;
}
```

### API Response
```protobuf
message APIResponse {
  bool success = 1;
  string message = 2;
  map<string, string> metadata = 3;
}
```

## Testing

### Using grpcurl

```bash
# Install grpcurl
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest

# List all services
grpcurl -plaintext localhost:50051 list

# Describe a service
grpcurl -plaintext localhost:50051 describe wealthjourney.auth.v1.AuthService

# Call an RPC
grpcurl -plaintext \
  -d '{"google_token": "test-token"}' \
  localhost:50051 \
  wealthjourney.auth.v1.AuthService/Register
```

### Using grpcui

```bash
# Install grpcui
go install github.com/fullstorydev/grpcui/cmd/grpcui@latest

# Start interactive web UI
grpcui -plaintext localhost:50051
```

### Testing REST Endpoints

```bash
# Using curl
curl -X POST http://localhost:8080/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"googleToken": "xxx"}'

# Using the API client
import { api } from "@/utils/generated/api";
const result = await api.auth.login({ googleToken: "xxx" });
```

## Troubleshooting

### Generated API has wrong endpoints

Edit `getHTTPPath()` in [generate-rest-api.js](scripts/generate-rest-api.js) to add custom mapping.

### Field names don't match REST API

Edit the request body transformation in the method-specific handling section of [generate-rest-api.js](scripts/generate-rest-api.js).

### Want different HTTP methods

Edit `getHTTPMethod()` in [generate-rest-api.js](scripts/generate-rest-api.js) to change detection logic.

### Proto generation fails

1. Ensure Buf CLI is installed: `buf --version`
2. Check proto syntax: `buf lint`
3. Verify dependencies: `buf mod update`

### Generated code doesn't compile

1. Check for conflicting types between proto and manual code
2. Ensure `ts-proto` options match your TypeScript config
3. Verify import paths in generated files

## See Also

- [Buf Documentation](https://buf.build/docs)
- [ts-proto Documentation](https://github.com/stephenh/ts-proto)
- [Protocol Buffers](https://protobuf.dev/)
- [gRPC Go Quick Start](https://grpc.io/docs/languages/go/quickstart/)
