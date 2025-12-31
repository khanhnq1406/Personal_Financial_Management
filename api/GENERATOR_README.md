# Auto-Generated REST API Client

This directory contains scripts to automatically generate type-safe REST API client code from Protocol Buffer definitions.

## Why Auto-Generate?

1. **Single Source of Truth**: Proto files define your API contract
2. **Type Safety**: Generated TypeScript types match your proto definitions
3. **No Manual Updates**: When proto changes, regenerate the API client
4. **Vercel Compatible**: Uses standard REST API (no gRPC needed)

## Quick Start

```bash
# Generate both types and API client
npm run generate:all

# Or run separately
npm run generate:types   # Generate protobuf types with buf
npm run generate:api     # Generate REST API methods from proto
```

## Generated Files

```
src/wj-client/
├── gen/protobuf/v1/           # Generated protobuf types (ts-proto)
│   ├── auth.ts
│   ├── wallet.ts
│   ├── user.ts
│   └── common.ts
└── utils/generated/
    └── api.ts                 # Generated REST API client
```

## Usage Example

```typescript
import { api } from "@/utils/generated/api";

// All methods are fully typed from proto definitions
const response = await api.auth.login({ googleToken: "xxx" });
const wallets = await api.wallet.listWallets({ pagination: { page: 1, pageSize: 10 } });
const user = await api.user.getUser({ userId: 123 });
```

## How It Works

### 1. Proto Definitions (`api/protobuf/v1/*.proto`)

Define your services in proto files:

```protobuf
service WalletService {
  rpc CreateWallet(CreateWalletRequest) returns (CreateWalletResponse);
  rpc GetWallet(GetWalletRequest) returns (GetWalletResponse);
  rpc ListWallets(ListWalletsRequest) returns (ListWalletsResponse);
}
```

### 2. Type Generation (`buf.gen.yaml`)

ts-proto generates TypeScript types:

```bash
npm run generate:types
```

### 3. API Generation (`api/scripts/generate-rest-api.js`)

The generator script:
1. Parses proto files to extract service definitions
2. Maps gRPC methods to REST endpoints
3. Generates type-safe API methods

```bash
npm run generate:api
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

## Customizing the Generator

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

## Workflow

1. **Edit proto file** in `api/protobuf/v1/`
2. **Run `npm run generate:all`**
3. **Use generated API** in your code

```bash
# Edit api/protobuf/v1/wallet.proto
vim api/protobuf/v1/wallet.proto

# Regenerate
npm run generate:all

# Done! Use the new API methods
```

## Troubleshooting

### Generated API has wrong endpoints

Edit `getHTTPPath()` in `generate-rest-api.js` to add your custom mapping.

### Field names don't match REST API

Edit the request body transformation in the method-specific handling section.

### Want different HTTP methods

Edit `getHTTPMethod()` to change the detection logic.

## File: generate-rest-api.js

The generator script:

- **Parses** proto files using regex to extract services and methods
- **Maps** gRPC naming conventions to REST endpoints
- **Generates** TypeScript code with full type safety
- **Handles** special cases like pagination, URL params, and query strings

## See Also

- [Buf Documentation](https://buf.build/docs)
- [ts-proto Documentation](https://github.com/stephenh/ts-proto)
- [Protocol Buffers](https://protobuf.dev/)
