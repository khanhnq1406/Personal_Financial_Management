# Railway Cold Start Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce Railway cold start times from 30s+ to 5-8s through database keep-alive, Docker optimization, and connection pool tuning.

**Architecture:** Add periodic database health checks to prevent PostgreSQL sleep, optimize Docker image size from 130MB to ~15MB using distroless base, and tune connection pool settings for faster wake-up on Railway's free tier.

**Tech Stack:** Go 1.24, Docker multi-stage builds, GORM connection pooling, Railway hosting

**Context:**
- Current issue: Backend and PostgreSQL sleep after inactivity on Railway Hobby (free) plan
- Cold start latency: 30+ seconds
- User impact: 20 users experiencing poor first-load experience
- Budget constraint: $0 (must use free tier)
- Complementary external solution: User will set up cron-job.org + UptimeRobot for HTTP endpoint pings

---

## Task 1: Add Database Keep-Alive Background Job ✅ COMPLETED

**Files:**
- Modified: `src/go-backend/cmd/server/main.go:250-277` (after portfolio snapshot job, before rate limiter)

**Purpose:** Prevent PostgreSQL from sleeping by executing lightweight queries every 2 minutes. This keeps the database connection pool active and reduces cold start latency from database reconnection (~20s of the 30s cold start).

**Step 1: Add database keep-alive goroutine**

Insert this code after line 248 (after the portfolio snapshot job closes its goroutine):

```go
	// Initialize database keep-alive job
	// This runs every 2 minutes to prevent Railway PostgreSQL from sleeping
	// Railway free tier puts idle databases to sleep after ~5 minutes of no activity
	// This lightweight query keeps the connection pool active
	go func() {
		ticker := time.NewTicker(2 * time.Minute)
		defer ticker.Stop()

		// Wait for server to be fully initialized
		time.Sleep(10 * time.Second)

		log.Println("Database keep-alive job started (runs every 2 minutes)")

		for {
			select {
			case <-ticker.C:
				ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)

				// Execute lightweight health check query
				// This uses the existing Ping() method which executes PingContext
				if err := db.Ping(); err != nil {
					log.Printf("Database keep-alive ping failed: %v", err)
				}

				cancel()

			case <-backgroundCtx.Done():
				log.Println("Database keep-alive job stopped (shutting down)")
				return
			}
		}
	}()
```

**Step 2: Verify the code compiles**

Run:
```bash
cd src/go-backend
go build ./cmd/server
```

Expected: Build succeeds with no errors

**Step 3: Test locally**

Run:
```bash
cd src/go-backend
go run ./cmd/server/main.go
```

Expected output (in logs):
```
Database keep-alive job started (runs every 2 minutes)
```

Wait 2 minutes and verify:
```
# Should NOT see any ping errors
```

---

## Task 2: Optimize Docker Image for Faster Cold Start ✅ COMPLETED

**Files:**
- Modified: `src/go-backend/Dockerfile` (complete rewrite with distroless base)
- Created: `src/go-backend/.dockerignore` (reduce build context)

**Purpose:** Reduce Docker image size from ~130MB (golang:1.24-alpine) to ~15MB (distroless) for faster container startup on Railway. Smaller images = faster pull/extract = faster cold start.

**Current Issue:** Runtime stage uses `golang:1.24-alpine` which includes unnecessary Go toolchain (not needed for compiled binary).

**Step 1: Replace runtime stage with distroless base**

Replace lines 23-38 in `src/go-backend/Dockerfile` with:

```dockerfile
# Runtime stage - Use distroless for minimal image size
FROM gcr.io/distroless/static:nonroot

WORKDIR /app

# Copy ca-certificates from builder for HTTPS calls
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy the binary from builder
COPY --from=builder /app/bin/server /app/server

# Use nonroot user for security
USER nonroot:nonroot

# Expose HTTP port (Railway will detect this automatically)
EXPOSE 8080

# Run the application
ENTRYPOINT ["/app/server"]
```

**Explanation:**
- `gcr.io/distroless/static:nonroot` - Minimal image with only libc, ~2MB base
- `COPY ca-certificates` - Required for HTTPS calls to Yahoo Finance API
- `USER nonroot:nonroot` - Security best practice (distroless includes non-root user)
- `ENTRYPOINT` instead of `CMD` - More explicit for single-binary container

**Step 2: Verify Docker build succeeds**

Run:
```bash
cd /Users/admin/Desktop/khanh/workspace/Personal_Financial_Management
docker build -f src/go-backend/Dockerfile -t wealthjourney-backend:test .
```

Expected:
- Build completes successfully
- No errors about missing dependencies

**Step 3: Check image size reduction**

Run:
```bash
docker images wealthjourney-backend:test
```

Expected output:
```
REPOSITORY              TAG       SIZE
wealthjourney-backend   test      ~12-18MB (down from ~130MB)
```

**Step 4: Test the container locally**

Run:
```bash
# Create minimal .env for testing
docker run --rm \
  -e PORT=8080 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_USER=test \
  -e DB_PASSWORD=test \
  -e DB_NAME=wealthjourney \
  -e JWT_SECRET=test-secret-key-123 \
  -p 8080:8080 \
  wealthjourney-backend:test
```

Expected:
- Container starts successfully
- Health check responds: `curl http://localhost:8080/health`
- If DB connection fails, that's OK (we're testing binary execution, not full app)

Press Ctrl+C to stop.

**Step 5: Clean up test image**

Run:
```bash
docker rmi wealthjourney-backend:test
```

**Implementation Results:**

Image size comparison:
- **Before (golang:1.24-alpine base)**: 312MB
- **After (distroless/static-debian12:nonroot)**: 35.7MB
- **Reduction**: 276.3MB (88.6% smaller!)

Key optimizations applied:
1. Removed unnecessary protobuf build tools from builder
2. Added `.dockerignore` to exclude test files, docs, and local files
3. Used `CGO_ENABLED=0` for static binary
4. Used `-ldflags="-s -w"` to strip debug symbols
5. Switched from `golang:1.24-alpine` (~300MB runtime) to `distroless/static-debian12:nonroot` (~2MB base)

Container verified:
- Binary executes successfully with distroless base
- CA certificates copied for HTTPS support
- Runs as non-root user for security
- No shell access (distroless advantage for security)

---

## Task 3: Tune Connection Pool for Railway Free Tier

**Files:**
- Modify: `src/go-backend/pkg/config/config.go:88-93` (database pool defaults)

**Purpose:** Reduce default connection pool size for faster startup on Railway free tier. Current defaults (15 max open, 5 max idle) are optimized for Supabase Pro, but Railway Hobby PostgreSQL has lower limits and benefits from smaller pools during cold starts.

**Current Values:**
- `DB_MAX_OPEN_CONNS`: 15 (optimized for Supabase Pro tier)
- `DB_MAX_IDLE_CONNS`: 5
- `DB_CONN_MAX_LIFETIME`: 1h (long lifetime for Supabase)
- `DB_CONN_MAX_IDLE_TIME`: 10m

**New Values for Railway:**
- `DB_MAX_OPEN_CONNS`: 5 (Railway free tier limit is ~20, be conservative)
- `DB_MAX_IDLE_CONNS`: 2 (fewer idle = faster startup)
- `DB_CONN_MAX_LIFETIME`: 30m (shorter lifetime = fresher connections)
- `DB_CONN_MAX_IDLE_TIME`: 5m (shorter idle = less stale connections)

**Step 1: Update default connection pool settings**

Replace lines 88-93 in `src/go-backend/pkg/config/config.go`:

```go
	// Database pool settings
	// Railway free tier defaults: smaller pool for faster cold start
	// Can be overridden via env vars for production deployment
	maxOpenConns, _ := strconv.Atoi(getEnv("DB_MAX_OPEN_CONNS", "5"))
	maxIdleConns, _ := strconv.Atoi(getEnv("DB_MAX_IDLE_CONNS", "2"))
	// Shorter lifetime for Railway to reduce connection staleness
	connMaxLifetime, _ := time.ParseDuration(getEnv("DB_CONN_MAX_LIFETIME", "30m"))
	// Keep idle connections fresh but not too long
	connMaxIdleTime, _ := time.ParseDuration(getEnv("DB_CONN_MAX_IDLE_TIME", "5m"))
```

**Step 2: Update inline comments for clarity**

Update the comment above the pool settings (around line 86-87):

```go
	// Database pool settings
	// Railway free tier defaults: smaller pool for faster cold start
	// Previous Supabase defaults: maxOpen=15, maxIdle=5, lifetime=1h
	// Railway optimized: maxOpen=5, maxIdle=2, lifetime=30m
	// Override via env vars for production (Supabase Pro/Enterprise)
```

**Step 3: Verify build succeeds**

Run:
```bash
cd src/go-backend
go build ./cmd/server
```

Expected: No errors

**Step 4: Verify configuration validation still passes**

Run:
```bash
cd src/go-backend
go test ./pkg/config -v -run TestValidate
```

Expected: Tests pass (if tests exist)

If no tests exist, manually verify by checking:
```bash
# Check that maxIdleConns (2) <= maxOpenConns (5)
# This is validated in config.go:183-185
grep -A 3 "MaxIdleConns > c.Database.MaxOpenConns" pkg/config/config.go
```

**Step 5: Document Railway-specific configuration**

Create environment variable documentation comment at the top of the Database struct:

In `src/go-backend/pkg/config/config.go`, add comment above `type Database struct` (line 30):

```go
// Database configuration
// Default values optimized for Railway free tier (low connection limits)
// For production deployments (Supabase Pro/Enterprise):
//   DB_MAX_OPEN_CONNS=15
//   DB_MAX_IDLE_CONNS=5
//   DB_CONN_MAX_LIFETIME=1h
//   DB_CONN_MAX_IDLE_TIME=10m
type Database struct {
```

---

## Task 4: Deploy to Railway and Verify

**Files:**
- No code changes (deployment verification only)

**Purpose:** Deploy changes to Railway and measure cold start improvement.

**Prerequisites:**
- Railway project already configured
- `railway.json` exists with health check config
- Railway CLI installed (or use Railway dashboard)

**Step 1: Deploy to Railway**

Option A - Railway CLI:
```bash
railway up
```

Option B - Railway Dashboard:
- Railway auto-deploys on push to main (if configured)
- Check deployment status at railway.app/project/<your-project>

**Step 2: Wait for deployment to complete**

Monitor deployment logs:
```bash
railway logs
```

Expected in logs:
```
Database connected and migrated successfully (pool: maxOpen=5, maxIdle=2)
Background price update job started (runs every 15 minutes)
Background portfolio snapshot job started (runs every hour)
Database keep-alive job started (runs every 2 minutes)  <-- NEW
Starting REST server on port 8080...
Starting gRPC server on port 50051...
Starting gRPC-Gateway server on port 8081...
```

**Step 3: Test cold start latency (before external pings)**

Wait 10 minutes for Railway to put services to sleep, then test:

```bash
# Replace with your Railway URL
time curl -s https://your-app.railway.app/health
```

Expected:
- First request (cold start): ~8-12 seconds (improved from 30s+)
- Second request (warm): <500ms

**Step 4: Verify database keep-alive is working**

Check Railway logs after 2-4 minutes:

```bash
railway logs --tail 50
```

Expected: NO "Database keep-alive ping failed" errors

If you see errors:
- Check database environment variables (DB_HOST, DB_PORT, etc.)
- Check Railway PostgreSQL service is running
- Check connection string format

**Step 5: Document Railway environment variables**

Ensure Railway has these environment variables set (Railway dashboard → Variables):

```bash
# Database (Railway PostgreSQL plugin provides these)
DATABASE_URL=postgresql://...
DB_HOST=<from-railway>
DB_PORT=<from-railway>
DB_USER=<from-railway>
DB_PASSWORD=<from-railway>
DB_NAME=<from-railway>

# Optional overrides (use defaults from code)
# DB_MAX_OPEN_CONNS=5
# DB_MAX_IDLE_CONNS=2
# DB_CONN_MAX_LIFETIME=30m
# DB_CONN_MAX_IDLE_TIME=5m

# Server
PORT=8080
GIN_MODE=release

# JWT (REQUIRED - set to secure value)
JWT_SECRET=<your-secure-secret-min-32-chars>

# Google OAuth (if using)
GOOGLE_CLIENT_ID=<your-google-client-id>

# Redis (Railway Redis plugin provides)
REDIS_URL=<from-railway>
REDIS_PASSWORD=<from-railway>

# Rate limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60

# Yahoo Finance (optional, enabled by default)
YAHOO_FINANCE_ENABLED=true
YAHOO_FINANCE_CACHE_MAX_AGE=15m
```

---

## Task 5: Set Up External Health Check Pings (Manual User Task)

**Purpose:** Prevent Railway from putting services to sleep by pinging the health endpoint every 3-5 minutes using free external services.

**Files:** None (external service configuration)

**Step 1: Set up cron-job.org**

1. Go to https://cron-job.org/en/
2. Sign up for free account (no credit card required)
3. Click "Create cronjob"
4. Configure:
   - **Title:** "WealthJourney Backend Keep-Alive"
   - **URL:** `https://your-app.railway.app/health`
   - **Schedule:** Every 3 minutes (select "Every X minutes" and enter 3)
   - **Timeout:** 30 seconds
   - **HTTP Method:** GET
   - **Save**

Expected behavior:
- cron-job.org will ping your backend every 3 minutes
- This keeps Railway from detecting "no activity"

**Step 2: Set up UptimeRobot (backup + monitoring)**

1. Go to https://uptimerobot.com/
2. Sign up for free account
3. Click "+ Add New Monitor"
4. Configure:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** "WealthJourney Backend"
   - **URL:** `https://your-app.railway.app/health`
   - **Monitoring Interval:** 5 minutes (free tier)
   - **Monitor Timeout:** 30 seconds
   - **Alert Contacts:** Your email
   - **Create Monitor**

Expected behavior:
- UptimeRobot pings every 5 minutes (backup for cron-job.org)
- Sends email alerts if backend goes down
- Provides uptime statistics dashboard

**Step 3: Verify pings are working**

Wait 5-10 minutes, then check:

1. **cron-job.org:**
   - Go to "My cronjobs"
   - Click on your job
   - Check "Execution history"
   - Expected: All executions show "200 OK"

2. **UptimeRobot:**
   - Go to dashboard
   - Check monitor status
   - Expected: Green "Up" status with response time ~200-500ms

**Step 4: Monitor for 24 hours**

After 24 hours, verify:
- No cold starts during business hours
- Cold starts reduced to <10 seconds (if any occur)
- UptimeRobot shows 99%+ uptime

**Step 5: Document external services**

Add to project README or wiki:

```markdown
## External Services

### Keep-Alive Monitoring
- **cron-job.org:** Pings /health every 3 minutes to prevent Railway sleep
- **UptimeRobot:** Pings /health every 5 minutes + uptime monitoring

### Access
- cron-job.org: [Login link]
- UptimeRobot: [Dashboard link]

### Troubleshooting
If backend is still sleeping:
1. Check cron-job.org execution history for failures
2. Check UptimeRobot for downtime alerts
3. Verify Railway health check endpoint is responding
4. Consider upgrading to Railway Pro ($5/month for always-on)
```

---

## Testing Strategy

### Unit Tests
**Scope:** Configuration validation

**Test File:** `src/go-backend/pkg/config/config_test.go` (create if doesn't exist)

**Tests to add:**
```go
func TestDatabaseConfigDefaults(t *testing.T) {
    // Test that defaults are optimized for Railway
    cfg := &Config{
        Database: Database{
            MaxOpenConns:    5,
            MaxIdleConns:    2,
            ConnMaxLifetime: 30 * time.Minute,
            ConnMaxIdleTime: 5 * time.Minute,
        },
    }

    // Verify maxIdle <= maxOpen
    if cfg.Database.MaxIdleConns > cfg.Database.MaxOpenConns {
        t.Error("MaxIdleConns should not exceed MaxOpenConns")
    }
}

func TestDatabaseConfigValidation(t *testing.T) {
    // Test validation catches invalid pool settings
    cfg := &Config{
        Database: Database{
            MaxOpenConns: 5,
            MaxIdleConns: 10, // Invalid: exceeds maxOpen
        },
    }

    err := cfg.Validate()
    if err == nil {
        t.Error("Expected validation error for maxIdle > maxOpen")
    }
}
```

**Run:**
```bash
cd src/go-backend
go test ./pkg/config -v
```

### Integration Tests
**Scope:** Database keep-alive job

**Manual test:**
1. Start server locally
2. Check logs for "Database keep-alive job started"
3. Wait 2 minutes
4. Check logs for "Database keep-alive ping failed" (should NOT appear)
5. Check database connections: `SELECT count(*) FROM pg_stat_activity WHERE datname='wealthjourney';`

Expected: 2-5 connections active

### End-to-End Tests
**Scope:** Cold start latency on Railway

**Test procedure:**
1. Deploy to Railway
2. Wait 10 minutes (allow sleep)
3. Measure cold start time: `time curl https://your-app.railway.app/health`
4. Expected: <10 seconds
5. Repeat 3 times to get average

**Success criteria:**
- Average cold start < 10s
- P95 cold start < 15s
- 70%+ improvement from baseline (30s)

---

## Rollback Plan

If issues occur after deployment:

### Rollback Task 1 (Database Keep-Alive)
```bash
git revert <commit-hash-task-1>
git push origin main
```

**Reason to rollback:**
- Database ping failures causing log spam
- Connection pool exhaustion
- Increased Railway resource usage

### Rollback Task 2 (Docker Optimization)
```bash
git revert <commit-hash-task-2>
git push origin main
```

**Reason to rollback:**
- Container fails to start with distroless
- Missing dependencies (SSL certs, etc.)
- Debugging difficulty (no shell in distroless)

**Alternative:** Keep golang:alpine but use smaller version:
```dockerfile
FROM golang:1.24-alpine3.19
```

### Rollback Task 3 (Connection Pool)
```bash
# No code rollback needed - override via Railway env vars
# In Railway dashboard, set:
DB_MAX_OPEN_CONNS=15
DB_MAX_IDLE_CONNS=5
DB_CONN_MAX_LIFETIME=1h
DB_CONN_MAX_IDLE_TIME=10m
```

**Reason to rollback:**
- Connection pool too small for traffic
- Database connection errors under load
- Slower query performance

---

## Success Metrics

### Primary Metrics
- **Cold start latency:** <10s (target), <15s (acceptable)
- **Cold start frequency:** <3 per day with external pings
- **Image size:** <20MB (target), <50MB (acceptable)

### Secondary Metrics
- **Database keep-alive uptime:** >99%
- **External ping success rate:** >95% (cron-job.org + UptimeRobot)
- **Railway resource usage:** No increase in CPU/memory usage
- **User-reported issues:** Zero reports of "app not loading"

### Monitoring
- Railway dashboard: Monitor CPU, memory, request latency
- UptimeRobot: Monitor uptime, response times
- Application logs: Monitor for "Database keep-alive ping failed"

---

## Known Limitations

1. **Not a complete solution:** External pings required to prevent sleep
2. **Railway free tier constraints:** May still sleep during low-traffic periods
3. **Database sleep:** PostgreSQL may still sleep if Railway enforces strict limits
4. **Network latency:** Railway cold start includes network time (not optimized here)

## Future Improvements

1. **Upgrade to Railway Pro:** $5/month for always-on (no sleep)
2. **Migrate to Render.com + Neon:** Better free tier for always-on services
3. **Implement edge caching:** Cloudflare Workers for instant response on cached data
4. **Add startup probes:** Railway startup probes for faster health check detection

---

## Estimated Timeline

- **Task 1:** 10 minutes (add keep-alive job)
- **Task 2:** 15 minutes (Docker optimization + local test)
- **Task 3:** 10 minutes (config tuning)
- **Task 4:** 20 minutes (deploy + verify + document)
- **Task 5:** 15 minutes (external pings setup + verify)

**Total:** ~70 minutes (1 hour 10 minutes)

---

## Prerequisites

- Railway project deployed and accessible
- Railway CLI installed (optional, can use dashboard)
- Docker installed locally for Task 2 testing
- Access to Railway environment variables
- Git push access to main branch

---

## Related Documentation

- Railway Documentation: https://docs.railway.app/
- Docker Multi-Stage Builds: https://docs.docker.com/build/building/multi-stage/
- GORM Connection Pooling: https://gorm.io/docs/generic_interface.html
- Distroless Images: https://github.com/GoogleContainerTools/distroless
