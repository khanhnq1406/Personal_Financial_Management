# WealthJourney Go Backend

A REST API backend service for personal financial management, migrated from NestJS/TypeScript to Go with Vercel serverless deployment.

## Features

- **REST API** - HTTP endpoints with Gin framework
- **Vercel Serverless** - Deploy seamlessly to Vercel
- **Google OAuth2 Authentication** - Secure authentication with Google
- **JWT Token Management** - Stateless authentication with Redis whitelist
- **MySQL Database** - Persistent storage with GORM
- **Redis Caching** - Session management and token whitelist
- **Clean Architecture** - Modular, maintainable code structure

## Project Structure

```
src/go-backend/
├── api/
│   ├── vercel.go            # Vercel serverless entry point
│   └── handlers/            # HTTP REST handlers
│       ├── auth.go          # Authentication endpoints
│       ├── user.go          # User endpoints
│       ├── wallet.go        # Wallet endpoints
│       ├── middleware.go    # Auth middleware
│       └── dependencies.go  # Dependency injection
├── internal/
│   ├── auth/                # Authentication service
│   ├── user/                # User service
│   ├── wallet/              # Wallet service
│   └── models/              # Database models
├── pkg/
│   ├── config/              # Configuration management
│   ├── database/            # Database connection
│   └── redis/               # Redis client
├── .env.example             # Environment variables template
├── vercel.json              # Vercel configuration
├── package.json             # NPM scripts for Vercel
├── Makefile                 # Build and run commands
├── go.mod                   # Go module definition
├── README.md                # This file
└── VERCEL_DEPLOYMENT.md     # Vercel deployment guide
```

## Prerequisites

- **Go** 1.21 or higher
- **Node.js** and **npm** (for Vercel deployment)
- **MySQL** 8.0 or higher (or Vercel Postgres)
- **Redis** 6.0 or higher (or Upstash Redis)

## Installation

### 1. Install Go dependencies

```bash
cd src/go-backend
make deps
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `3306` |
| `DB_USER` | Database user | `root` |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | `wealthjourney` |
| `REDIS_URL` | Redis URL | `localhost:6379` |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRATION` | JWT token expiration | `168h` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |

### 3. Run database migrations

The application uses GORM AutoMigrate, which will automatically create/update tables on startup.

## Running the Server

### Local Development with Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Run locally
vercel dev
```

The API will be available at `http://localhost:3000`

### Using the Makefile

```bash
make deps      # Install dependencies
make build     # Build the application
make run       # Run with Vercel dev
make clean     # Clean build artifacts
make test      # Run tests
make deploy    # Deploy to Vercel
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/auth/register` | Register with Google OAuth | No |
| `POST` | `/api/v1/auth/login` | Login with Google OAuth | No |
| `POST` | `/api/v1/auth/logout` | Logout | No* |
| `GET` | `/api/v1/auth/verify` | Verify authentication | No* |

*Token sent in request body or Authorization header

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/users` | Get all users | Yes |
| `GET` | `/api/v1/users/:email` | Get user by email | Yes |
| `POST` | `/api/v1/users` | Create new user | Yes |

### Wallets

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/wallets` | Create new wallet | Yes |
| `GET` | `/api/v1/wallets` | List user's wallets | Yes |
| `GET` | `/api/v1/wallets/:id` | Get wallet by ID | Yes |

## Authentication Flow

1. **Register**: Client sends Google OAuth token to `/api/v1/auth/register`
2. **Login**: Client sends Google OAuth token to `/api/v1/auth/login`
   - Server validates Google token
   - Server generates JWT token
   - Server stores token in Redis whitelist
   - Server returns JWT to client
3. **Authenticated Request**: Client includes JWT in `Authorization` header
   - Format: `Bearer <token>`
   - Server validates JWT and checks whitelist
4. **Logout**: Client sends token to `/api/v1/auth/logout`
   - Server removes token from Redis whitelist

## Database Schema

### User Table

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

### Wallet Table

```sql
CREATE TABLE wallet (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    wallet_name VARCHAR(50),
    balance FLOAT DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
```

## API Request Examples

### Register
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"google_token": "YOUR_GOOGLE_TOKEN"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"google_token": "YOUR_GOOGLE_TOKEN"}'
```

### Create Wallet (authenticated)
```bash
curl -X POST http://localhost:3000/api/v1/wallets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "My Wallet", "balance": 1000.00}'
```

### List Wallets (authenticated)
```bash
curl -X GET http://localhost:3000/api/v1/wallets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Migration from NestJS

This Go backend migrates all functionality from the original NestJS backend:

| NestJS (REST) | Go (REST/Vercel) |
|---------------|------------------|
| `POST /auth/register` | `POST /api/v1/auth/register` |
| `POST /auth/login` | `POST /api/v1/auth/login` |
| `POST /auth/logout` | `POST /api/v1/auth/logout` |
| `GET /auth` | `GET /api/v1/auth/verify` |
| `GET /user` | `GET /api/v1/users` |
| `POST /wallet/create` | `POST /api/v1/wallets` |
| `GET /wallet/list` | `GET /api/v1/wallets` |

## Vercel Deployment

For detailed Vercel deployment instructions, see [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md).

### Quick Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel
```

### Environment Variables for Vercel

Set these in your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `DB_HOST` | Database host |
| `DB_PORT` | Database port |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name |
| `REDIS_URL` | Redis URL |
| `JWT_SECRET` | JWT signing secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |

For production, consider using:
- **Vercel Postgres** for database
- **Upstash Redis** for caching

## Troubleshooting

### Database connection fails

Check MySQL is running and credentials in `.env` are correct.

### Redis connection fails

Check Redis is running:
```bash
redis-cli ping
```

### Import errors

Run `go mod tidy` to update module dependencies:
```bash
go mod tidy
```

### Vercel deployment fails

- Check all imports are correct
- Ensure `go.mod` is up to date
- Verify environment variables are set in Vercel dashboard

## License

This project is part of WealthJourney Personal Financial Management.
