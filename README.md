# WealthJourney - Personal Financial Management System

<div align="center">
  <img src="src/wj-client/public/logo.png" alt="WealthJourney Logo" width="200"/>
</div>

## 📖 Overview

Welcome to WealthJourney - Our platform empowers you to track expenses, set achievable savings goals, and make informed financial decisions. WealthJourney is a comprehensive personal finance management application designed to help users take control of their financial future through intuitive tracking, insightful analytics, and smart budgeting tools.

## 🌟 Features

### 🏠 Dashboard

- **Account Overview**: View all your accounts and wallets in one place
- **Balance Tracking**: Monitor total balance and individual wallet balances
- **Financial Insights**: Visual charts showing spending patterns and income
- **Monthly Reports**: Track monthly income, expenses, and savings
- **Transaction History**: Comprehensive view of all financial activities

### 💰 Wallet Management

- **Multiple Wallets**: Create and manage multiple wallets for different purposes
- **Money Transfer**: Easy transfer between wallets
- **Balance Tracking**: Real-time balance updates for all wallets
- **Custom Categories**: Organize transactions by custom categories

### 📊 Analytics & Reporting

- **Spending Analysis**: Detailed breakdown of expenses by category
- **Income Tracking**: Monitor various income sources
- **Monthly Dominance**: Visual representation of spending categories
- **Budget Progress**: Track progress towards financial goals

### 🔐 Security

- **Google OAuth Integration**: Secure authentication with Google
- **JWT Authentication**: Secure session management with Redis whitelist
- **Data Protection**: Your financial data is encrypted and protected

## 🏗️ Architecture

WealthJourney follows a modern microservices architecture with Protocol Buffer-first API design:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Protocol Buffers                        │
│                    (Single Source of Truth)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌─────────────────┐              ┌─────────────────┐
│   Frontend      │              │   Backend       │
│   (Next.js)     │◄────────────►│   (Go)          │
│   React 19      │              │   Gin/gRPC      │
│   TypeScript    │              │   GORM          │
└─────────────────┘              └─────────────────┘
        │                                 │
        ▼                                 ▼
   REST API                        MySQL + Redis
   (Port 3000)                     (Data + Cache)
```

### Technology Stack

**Frontend (`wj-client`)**

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with hooks and modern features
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Redux Toolkit & React Query** - State management and data fetching
- **Recharts** - Data visualization library
- **@react-oauth/google** - Google OAuth integration
- **ts-proto** - Protocol Buffer type generation

**Backend (`go-backend`)**

- **Go 1.23** - Backend programming language
- **Gin** - HTTP web framework for REST API
- **gRPC** - High-performance RPC framework
- **GORM** - ORM for MySQL database
- **MySQL 8.0** - Primary database
- **Redis 7** - Caching and session storage
- **JWT** - Authentication tokens with Redis whitelist
- **Google OAuth** - Authentication provider
- **Buf** - Protocol Buffer management

**API Layer (`api/`)**

- **Protocol Buffers** - API contract definition (single source of truth)
- **Buf** - Proto file management and validation
- **ts-proto** - TypeScript code generation from proto
- **Custom Generator** - REST API client generation from proto

**DevOps & Infrastructure**

- **Docker & Docker Compose** - Containerization
- **Vercel** - Deployment platform for frontend and backend
- **Adminer** - Database management interface
- **Buf CLI** - Protocol Buffer tooling

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v20 or higher)
- **Go** (1.21 or higher)
- **Docker** and **Docker Compose**
- **Buf CLI** (for proto generation)
- **MySQL** 8.0 or higher (or use Docker)
- **Redis** 6.0 or higher (or use Docker)

### Quick Start with Docker

The fastest way to get started is using Docker Compose:

```bash
# Start all services (MySQL, Redis, Go backend, Next.js frontend)
docker-compose up -d

# Frontend will be available at http://localhost:3000
# Backend API at http://localhost:8080
# gRPC at port 50051
# Adminer at http://localhost:8081
```

### Manual Setup

#### 1. Install Dependencies

```bash
# Frontend
cd src/wj-client
npm install

# Backend
cd src/go-backend
go mod download
```

#### 2. Configure Environment

**Frontend (`.env.local`)**:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

**Backend (`.env`)**:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=wealthjourney

# Redis
REDIS_URL=localhost:6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=168h

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### 3. Generate Code from Protos

```bash
# Frontend - Generate TypeScript types and REST API client
cd src/wj-client
npm run generate:all

# Backend - Generate Go protobuf code
cd src/go-backend
make generate-proto
```

#### 4. Start Services

```bash
# Start MySQL and Redis with Docker
docker-compose up -d mysql redis

# Start Go backend
cd src/go-backend
make run
# Backend will be at http://localhost:8080

# Start Next.js frontend (in another terminal)
cd src/wj-client
npm run dev
# Frontend will be at http://localhost:3000
```

### Access Points

| Service              | URL                   | Description               |
| -------------------- | --------------------- | ------------------------- |
| **Frontend**         | http://localhost:3000 | Next.js web application   |
| **Backend REST API** | http://localhost:8080 | Go backend REST endpoints |
| **Backend gRPC**     | localhost:50051       | gRPC server               |
| **Adminer**          | http://localhost:8081 | Database management UI    |

## 📁 Project Structure

```
Personal_Financial_Management/
├── README.md                          # This file
├── src/
│   ├── docker-compose.yml             # Docker services (MySQL, Redis, Adminer)
│   │
│   ├── go-backend/                    # Go backend with gRPC/REST support
│   │   ├── cmd/server/                # Server entry point
│   │   ├── api/
│   │   │   └── handlers/              # REST API handlers (auth, user, wallet)
│   │   ├── internal/
│   │   │   ├── grpcserver/            # gRPC server implementations
│   │   │   ├── service/               # Business logic service layer
│   │   │   ├── repository/            # Data access layer
│   │   │   └── models/                # Domain models (database entities)
│   │   ├── gen/protobuf/v1/           # Generated protobuf code
│   │   ├── pkg/                       # Shared packages (config, db, redis)
│   │   ├── docker-compose.yml         # Go backend services
│   │   ├── vercel.json                # Vercel deployment config
│   │   ├── Makefile                   # Build and run commands
│   │   └── go.mod/go.sum              # Go dependencies
│   │
│   ├── wj-client/                     # Next.js frontend
│   │   ├── app/                       # App Router pages
│   │   │   ├── auth/                  # Authentication pages
│   │   │   └── dashboard/             # Dashboard pages
│   │   ├── components/                # Reusable React components
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── utils/
│   │   │   └── generated/             # Auto-generated REST API client
│   │   ├── gen/protobuf/v1/           # Generated TypeScript types
│   │   ├── types/                     # TypeScript type definitions
│   │   └── public/                    # Static assets
│   │
│   └── wj-server/                     # Legacy NestJS backend (deprecated)
│
├── api/                               # Protocol Buffer definitions
│   ├── protobuf/v1/                   # Proto files (single source of truth)
│   │   ├── common.proto               # Shared types (Money, Pagination)
│   │   ├── auth.proto                 # Authentication service
│   │   ├── user.proto                 # User management service
│   │   └── wallet.proto               # Wallet management service
│   ├── scripts/
│   │   └── generate-rest-api.js       # REST API client generator
│   ├── buf.yaml                       # Buf configuration
│   ├── buf.gen.yaml                   # TypeScript generation config
│   └── buf.gen.go.yaml                # Go generation config
│
└── design/                            # Design files
    ├── system_design.drawio           # System architecture diagram
    └── Figma_UI_design.pdf            # UI/UX design specifications
```

## 📋 Protocol Buffer API

### Overview

WealthJourney uses **Protocol Buffers as the single source of truth** for API contracts. This provides:

- **Type Safety**: End-to-end type safety from proto definitions to UI
- **No Manual DTOs**: Proto types are used directly as DTOs in the service layer
- **Dual Protocol Support**: Both REST and gRPC from the same service layer
- **Vercel Compatible**: REST API works seamlessly with serverless deployment

### Protocol Definitions

All API contracts are defined in [`api/protobuf/v1/`](api/protobuf/v1/):

**Common Types** ([`common.proto`](api/protobuf/v1/common.proto)):

```protobuf
message Money {
  int64 amount = 1;      // Amount in smallest currency unit (cents)
  string currency = 2;   // ISO 4217 currency code (e.g., "USD")
}

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

**Services**:

- [`auth.proto`](api/protobuf/v1/auth.proto) - Authentication (Register, Login, Logout, Verify)
- [`user.proto`](api/protobuf/v1/user.proto) - User management (Get, List, Create, Update, Delete)
- [`wallet.proto`](api/protobuf/v1/wallet.proto) - Wallet management (CRUD, Add/Withdraw/Transfer funds)

### Code Generation

#### Frontend (TypeScript)

```bash
cd src/wj-client
npm run generate:all    # Generate both types and REST API client
npm run generate:types  # Only TypeScript types
npm run generate:api    # Only REST API client
```

#### Backend (Go)

```bash
cd src/go-backend
make generate-proto
```

### Using Generated Types

**Frontend**:

```typescript
import { api } from "@/utils/generated/api";

// All methods are fully typed from proto definitions
const response = await api.auth.login({ googleToken: "xxx" });
const wallets = await api.wallet.listWallets({
  pagination: { page: 1, pageSize: 10 },
});
const user = await api.user.getUser({ userId: 123 });
```

**Backend**:

```go
import protobufv1 "wealthjourney/gen/protobuf/v1"

// Service interface uses proto types directly
type WalletService interface {
    CreateWallet(ctx context.Context, userID int32, req *protobufv1.CreateWalletRequest) (*protobufv1.Wallet, error)
    GetWallet(ctx context.Context, walletID int32, userID int32) (*protobufv1.Wallet, error)
}
```

## 🔌 API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint            | Description                 | Auth Required |
| ------ | ------------------- | --------------------------- | ------------- |
| POST   | `/v1/auth/register` | Register with Google OAuth  | No            |
| POST   | `/v1/auth/login`    | Login with Google OAuth     | No            |
| POST   | `/v1/auth/logout`   | Logout and invalidate token | Yes           |
| GET    | `/v1/auth/verify`   | Verify JWT token validity   | Yes           |

### User Management Endpoints

| Method | Endpoint            | Description                | Auth Required |
| ------ | ------------------- | -------------------------- | ------------- |
| GET    | `/v1/users`         | Get current user profile   | Yes           |
| GET    | `/v1/users/all`     | List all users (paginated) | Yes (Admin)   |
| GET    | `/v1/users/:email`  | Get user by email          | Yes           |
| POST   | `/v1/users`         | Create new user            | Yes (Admin)   |
| PUT    | `/v1/users/profile` | Update user profile        | Yes           |
| DELETE | `/v1/users/:id`     | Delete user                | Yes (Admin)   |

### Wallet Management Endpoints

| Method | Endpoint                   | Description                     | Auth Required |
| ------ | -------------------------- | ------------------------------- | ------------- |
| POST   | `/v1/wallets`              | Create new wallet               | Yes           |
| GET    | `/v1/wallets`              | List user's wallets (paginated) | Yes           |
| GET    | `/v1/wallets/:id`          | Get wallet by ID                | Yes           |
| PUT    | `/v1/wallets/:id`          | Update wallet                   | Yes           |
| DELETE | `/v1/wallets/:id`          | Delete wallet                   | Yes           |
| POST   | `/v1/wallets/:id/add`      | Add funds to wallet             | Yes           |
| POST   | `/v1/wallets/:id/withdraw` | Withdraw funds                  | Yes           |
| POST   | `/v1/wallets/transfer`     | Transfer between wallets        | Yes           |

### Query Parameters

**Pagination** (for LIST endpoints):

```
?page=1&pageSize=10&orderBy=created_at&order=desc
```

## 🗄️ Database Schema

The application uses MySQL with the following main tables:

### Users

```sql
CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100),
    picture VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Wallets

```sql
CREATE TABLE wallet (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    wallet_name VARCHAR(50),
    wallet_type VARCHAR(20),  -- 'basic' or 'investment'
    balance BIGINT DEFAULT 0,  -- Stored in cents (Money type)
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
```

### Categories

```sql
CREATE TABLE category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_name VARCHAR(50),
    type VARCHAR(20),  -- 'income' or 'expense'
    icon VARCHAR(50),
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
```

### Transactions

```sql
CREATE TABLE transaction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    category_id INT,
    amount BIGINT,  -- Stored in cents
    transaction_type VARCHAR(20),  -- 'income' or 'expense'
    note TEXT,
    transaction_date TIMESTAMP,
    created_at TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallet(id),
    FOREIGN KEY (category_id) REFERENCES category(id)
);
```

## 🔐 Authentication Flow

1. **Register/Login**: Client sends Google OAuth token to `/v1/auth/register` or `/v1/auth/login`

   - Server validates Google token
   - Server generates JWT token
   - Server stores token in Redis whitelist
   - Server returns JWT to client

2. **Authenticated Request**: Client includes JWT in `Authorization` header

   - Format: `Bearer <token>`
   - Server validates JWT signature
   - Server checks token exists in Redis whitelist
   - Server extracts user ID from token

3. **Logout**: Client sends token to `/v1/auth/logout`
   - Server removes token from Redis whitelist
   - Token becomes invalid immediately

## 🚀 Deployment

### Vercel Deployment (Recommended)

The Go backend is configured for Vercel serverless deployment.

#### Backend Deployment

```bash
cd src/go-backend

# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel
```

**Environment Variables** (set in Vercel dashboard):
| Variable | Description |
|----------|-------------|
| `DB_HOST` | Database host |
| `DB_PORT` | Database port |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name |
| `REDIS_URL` | Redis URL |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRATION` | Token expiration |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |

**Production Databases**:

- **Vercel Postgres** for database (recommended)
- **Upstash Redis** for caching (recommended)

#### Frontend Deployment

```bash
cd src/wj-client

# Deploy to Vercel
vercel
```

**Environment Variables**:

```env
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🧪 Development

### Frontend Development

```bash
cd src/wj-client
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Backend Development

```bash
cd src/go-backend
make deps            # Install dependencies
make build           # Build the application
make run             # Run with Vercel dev
make test            # Run tests
make clean           # Clean build artifacts
make generate-proto  # Generate protobuf code
```

### Proto Development Workflow

1. **Edit proto file** in `api/protobuf/v1/`
2. **Regenerate code**:

   ```bash
   # Frontend
   cd src/wj-client && npm run generate:all

   # Backend
   cd src/go-backend && make generate-proto
   ```

3. **Implement service methods** in Go backend
4. **Use generated API** in TypeScript frontend

## 🎯 Roadmap

### Upcoming Features

- [ ] **Mobile App**: React Native application for iOS and Android
- [ ] **Advanced Analytics**: Machine learning for spending insights
- [ ] **Investment Tracking**: Portfolio management features
- [ ] **Bill Reminders**: Automatic bill payment reminders
- [ ] **Multi-currency Support**: Handle multiple currencies
- [ ] **Export Features**: Export data to PDF, CSV formats
- [ ] **API for Third-party Integration**: Connect with banks and financial services
- [ ] **Collaborative Features**: Family budgeting and shared accounts
- [ ] **gRPC-Web**: Full gRPC support in browser with gRPC-Web

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- **Always update proto files first** when changing API contracts
- **Regenerate code** after proto changes
- Write tests for new features
- Update documentation as needed
- Use TypeScript for type safety
- Follow the established folder structure

## 🐛 Troubleshooting

### Proto generation fails

```bash
# Ensure Buf CLI is installed
buf --version

# Check proto syntax
cd api && buf lint

# Verify dependencies
buf mod update
```

### Database connection fails

Check MySQL is running:

```bash
docker-compose ps mysql
docker-compose logs mysql
```

### Redis connection fails

Check Redis is running:

```bash
redis-cli ping
```

### Import errors

```bash
# Backend
cd src/go-backend
go mod tidy

# Frontend
cd src/wj-client
npm install
```

## 📄 License

This project is part of WealthJourney Personal Financial Management.

---

<div align="center">
  Made with ❤️ by Khanh Nguyen
</div>
