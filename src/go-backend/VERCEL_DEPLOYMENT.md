# Vercel Deployment Guide

This guide explains how to deploy the WealthJourney Go backend to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally
   ```bash
   npm i -g vercel
   ```
3. **GitHub Repository**: Push your code to GitHub

## Environment Variables

Configure these in your Vercel project settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | Database host | `your-mysql-host.com` |
| `DB_PORT` | Database port | `3306` |
| `DB_USER` | Database user | `wealthjourney` |
| `DB_PASSWORD` | Database password | `your-password` |
| `DB_NAME` | Database name | `wealthjourney` |
| `REDIS_URL` | Redis URL | `your-redis-host:6379` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `JWT_EXPIRATION` | Token expiration | `168h` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `your-client-id` |

### For Vercel Postgres (recommended):

Use `DATABASE_URL` instead of separate DB variables:
```
DATABASE_URL=postgres://user:password@host:port/database
```

### For Upstash Redis (recommended):

```
REDIS_URL=your-upstash-redis-url
```

## Local Development

### Install dependencies
```bash
cd src/go-backend
go mod download
```

### Run with Vercel dev
```bash
vercel dev
```

This will start a local server at `http://localhost:3000`

## Deploying to Vercel

### Option 1: Deploy from CLI

```bash
cd src/go-backend
vercel
```

Follow the prompts to deploy.

### Option 2: Deploy from GitHub

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Configure project settings:
   - **Framework Preset**: Go
   - **Root Directory**: `src/go-backend`
   - **Build Command**: (leave empty - auto-detected)
5. Add environment variables
6. Click **Deploy**

## API Endpoints

Once deployed, your API will be available at:

```
https://your-project.vercel.app
```

### Health Check
```
GET /health
```

### Authentication
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/verify
```

### Users (requires auth)
```
GET    /api/v1/users
GET    /api/v1/users/:email
POST   /api/v1/users
```

### Wallets (requires auth)
```
POST   /api/v1/wallets
GET    /api/v1/wallets
GET    /api/v1/wallets/:id
```

## Request Examples

### Register
```bash
curl -X POST https://your-project.vercel.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"google_token": "YOUR_GOOGLE_TOKEN"}'
```

### Login
```bash
curl -X POST https://your-project.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"google_token": "YOUR_GOOGLE_TOKEN"}'
```

### Create Wallet (authenticated)
```bash
curl -X POST https://your-project.vercel.app/api/v1/wallets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "My Wallet", "balance": 1000.00}'
```

### List Wallets (authenticated)
```bash
curl -X GET https://your-project.vercel.app/api/v1/wallets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Database Setup

### Option 1: Vercel Postgres

1. In Vercel project, go to **Storage** → **Create Database**
2. Select **Postgres**
3. Use the connection string in environment variables
4. Update `pkg/database/database.go` to parse `DATABASE_URL`

### Option 2: External MySQL

1. Use PlanetScale, AWS RDS, or any MySQL hosting
2. Configure connection variables in Vercel
3. Ensure your Vercel project can access the database

### Option 3: Docker (local only)

```bash
docker-compose up -d mysql redis
```

## Troubleshooting

### Build fails

- Check Go version in `go.mod` (Vercel supports Go 1.19+)
- Ensure all dependencies are in `go.mod`
- Run `go mod tidy` locally first

### Database connection fails

- Verify environment variables are set
- Check database allows connections from Vercel's IP ranges
- Use connection pooling for serverless

### Functions timeout

- Vercel serverless functions have max 10s (Hobby) or 60s (Pro)
- Consider using Vercel Cron Jobs for long tasks
- Optimize database queries

### Redis connection fails

- Verify `REDIS_URL` is correct
- Check Redis allows external connections
- Consider using Upstash Redis (Vercel integrated)

## Monitoring

View logs and metrics in your Vercel dashboard:
- **Deployments**: Build logs and deployment history
- **Functions**: Execution time and error rates
- **Logs**: Real-time function logs

## Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Configure production database
- [ ] Set up Redis for session management
- [ ] Add error tracking (Sentry, etc.)
- [ ] Enable analytics
- [ ] Set up custom domain
- [ ] Configure rate limiting
- [ ] Add request logging
- [ ] Set up alerts for errors
- [ ] Review security settings

## Cost Considerations

- Vercel Hobby: Free (100GB bandwidth, 1000 invocations/day)
- Vercel Pro: $20/month (1TB bandwidth, unlimited invocations)
- Database: Vercel Postgres from $0/month (256MB)
- Redis: Upstash Redis from $0/month (10K commands/day)

## Additional Resources

- [Vercel Go Runtime](https://vercel.com/docs/concepts/functions/runtimes/go)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Upstash Redis](https://upstash.com/)
