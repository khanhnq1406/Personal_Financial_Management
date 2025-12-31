# gRPC Integration Guide

This document describes the gRPC integration for the WealthJourney Personal Financial Management application.

## Architecture

The application now supports both REST and gRPC protocols:

- **REST API**: Traditional JSON-based HTTP API on port 8080
- **gRPC API**: High-performance RPC API on port 50051

Both servers run concurrently and share the same service layer.

## Protocol Buffer Definitions

Protocol buffer definitions are located in `api/protobuf/v1/`:

- `common.proto` - Shared types (Money, Pagination)
- `auth.proto` - Authentication service (Register, Login, Logout, Verify)
- `user.proto` - User management service
- `wallet.proto` - Wallet management service

## Generating Code

### Backend (Go)

```bash
cd src/go-backend
make generate-proto
```

Or manually:
```bash
cd api
buf generate --template buf.gen.go.yaml
```

Generated files are in `src/go-backend/gen/`:
- `gen/common/v1/` - Common types
- `gen/auth/v1/` - Auth service and types
- `gen/user/v1/` - User service and types
- `gen/wallet/v1/` - Wallet service and types

### Frontend (TypeScript)

```bash
cd src/wj-client
npm run generate:types
```

Or manually:
```bash
cd api
buf generate --template buf.gen.yaml
```

Generated files are in `src/wj-client/gen/protobuf/v1/`:
- `auth.ts` - Auth types and client
- `user.ts` - User types and client
- `wallet.ts` - Wallet types and client
- `common.ts` - Common types

## Backend Usage

### Starting the Servers

The main server (`cmd/server/main.go`) now starts both REST and gRPC servers:

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

### Using the gRPC Client

```typescript
import { createAuthServiceClient } from '@/utils/grpc-client';
import { LoginRequest } from '@/gen/protobuf/v1/auth';

// Create client
const authClient = createAuthServiceClient();

// Make a call
const request: LoginRequest = {
  googleToken: 'your-google-token'
};

const response = await authClient.login(request, (error, response) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Response:', response);
});
```

### Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_GRPC_URL=http://localhost:50051
```

## gRPC-Web for Browser Support

Browsers cannot directly use gRPC (HTTP/2). Two solutions:

### Option 1: gRPC-Web Transcoding

Use Envoy proxy or grpc-gateway to transcode gRPC to REST. This allows browsers to use standard HTTP/JSON.

### Option 2: gRPC-Web with Proxy

1. Browser uses grpc-web to send unary RPCs
2. Envoy proxy converts to gRPC and forwards to backend
3. Backend processes with standard gRPC

For development, we currently fall back to REST API calls. The generated TypeScript types are still useful for type safety.

## Testing gRPC

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

## Project Structure

```
Personal_Financial_Management/
├── api/
│   ├── protobuf/v1/          # Protocol buffer definitions
│   │   ├── common.proto
│   │   ├── auth.proto
│   │   ├── user.proto
│   │   └── wallet.proto
│   ├── buf.yaml              # Buf configuration
│   ├── buf.gen.yaml          # TypeScript generation config
│   └── buf.gen.go.yaml       # Go generation config
├── src/go-backend/
│   ├── cmd/server/main.go    # Main server (REST + gRPC)
│   ├── internal/grpcserver/  # gRPC server implementations
│   ├── internal/service/     # Business logic (shared)
│   └── gen/                  # Generated Go code
└── src/wj-client/
    ├── gen/protobuf/v1/      # Generated TypeScript code
    ├── types/api.ts          # API types
    └── utils/
        ├── api-client.ts     # REST API client
        └── grpc-client.ts    # gRPC client wrapper
```

## Migration Path

The application supports dual protocol operation:

1. **Phase 1** (Current): REST + gRPC servers running, frontend using REST
2. **Phase 2**: Frontend gradually adopts gRPC for internal services
3. **Phase 3**: Full gRPC adoption with gRPC-Web for browser clients

This allows gradual migration without breaking existing functionality.
