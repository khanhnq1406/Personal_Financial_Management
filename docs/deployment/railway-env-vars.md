# Railway Environment Variables

## Required for Alpine Containers

### ENABLE_ALPINE_PRIVATE_NETWORKING

**Value:** `true`

**Why:** Railway's private networking (postgres.railway.internal) uses IPv6 addresses that don't work with Alpine containers by default. This environment variable enables the necessary networking support.

**Error without this:**
```
dial tcp [fd12:37af:6ebc:1:9000:1c:27ac:1ffa]:5432: connect: connection refused
```

**How to set:**
1. Go to Railway project settings
2. Navigate to your Go backend service
3. Add environment variable: `ENABLE_ALPINE_PRIVATE_NETWORKING=true`
4. Redeploy the service

**Reference:** https://station.railway.com/questions/suddenly-can-t-connect-privately-using-p-0f1537ab

## Connection Pool Tuning Guide

### Why Lower Values for Railway Free Tier?

Railway's free PostgreSQL has a **hard limit of 100 connections**. Connection exhaustion causes "connection refused" errors even when the database is running.

When a connection pool is exhausted:
- New database requests fail with `connection refused` or `too many clients` errors
- Health checks start failing
- The application appears unstable even though code is working correctly

### Recommended Settings Breakdown

| Setting                | Code Default | Railway Free Tier | Explanation                                                                  |
| ---------------------- | ------------ | ----------------- | ---------------------------------------------------------------------------- |
| `DB_MAX_OPEN_CONNS`    | 5            | 10                | Max concurrent connections. Higher for Railway to handle concurrent requests |
| `DB_MAX_IDLE_CONNS`    | 2            | 3                 | Idle connections kept warm. Higher for Railway to reduce connection overhead|
| `DB_CONN_MAX_LIFETIME` | 0 (no limit) | 30m               | Max connection age. Set to 30m to prevent stale connections on free tier     |
| `DB_CONN_MAX_IDLE_TIME`| 0 (no limit) | 5m                | Max idle time before closing. Set to 5m to prevent Railway from sleeping DB  |

### Formula for Multi-Service Projects

If you have multiple services connecting to the same PostgreSQL:

```
Total connections = (MaxOpenConns × Number of Services) + Buffer
Example: (10 × 3 services) + 10 buffer = 40 connections (well under 100 limit)
```

**Example multi-service architecture:**
- Go backend: 10 connections
- Node.js migration service: 5 connections
- Background worker: 10 connections
- **Total: 25 connections + 10 buffer = 35 (safe for Railway free tier)**

### Symptoms of Connection Pool Issues

**Too Few Connections (Underutilization):**
- Slow API responses
- Connection wait timeouts in logs
- High `wait_count` in pool stats
- Database appears slow even though queries are optimized

**Too Many Connections (Exhaustion):**
- `connection refused` errors
- `too many clients` PostgreSQL errors
- Keep-alive pings failing
- Random failures in production that don't occur locally

### Monitoring Connection Pool Health

Check pool stats via Railway logs:

```bash
railway logs --service your-backend --filter "keep-alive"
```

Pool stats are logged on every failure and every 5th successful ping:

```
Database keep-alive ping success | Pool stats: open=5, in_use=2, idle=3
```

**Pool stats reference:**
- `max_open_connections` - Maximum number of open connections (from DB_MAX_OPEN_CONNS)
- `open_connections` - Current number of open connections
- `in_use` - Number of connections currently being used
- `idle` - Number of idle connections available for reuse
- `wait_count` - Total number of connections waited for

**Example pool stats:**
```
Healthy: open=5, in_use=2, idle=3 (has spare connections)
Unhealthy: open=10, in_use=10, idle=0 (maxed out, no spares)
```

**Healthy pool:**
- `open_connections` < `max_open_connections`
- `idle` > 0 (some warm connections available)
- `wait_count` = 0 or growing slowly
- Connections are reused (not constantly opened/closed)

**Unhealthy pool:**
- `open_connections` = `max_open_connections` (maxed out)
- `idle` = 0 (no spare connections)
- `wait_count` growing rapidly
- Frequent connection churn in logs

### Troubleshooting Steps

1. **Check current pool stats:**
   ```bash
   curl https://your-app.railway.app/health
   ```

2. **Review logs for connection errors:**
   ```bash
   railway logs --service your-backend
   ```

3. **Adjust settings based on traffic:**
   - Low traffic: Reduce `DB_MAX_IDLE_CONNS` to 2
   - High traffic: Increase `DB_MAX_OPEN_CONNS` gradually (monitor closely)

4. **Consider connection pooling middleware:**
   - PgBouncer can help manage connections across multiple services
   - Railway offers built-in connection pooling on paid tiers

### Environment Variable Quick Reference

```bash
# Railway Free Tier (Recommended)
DB_MAX_OPEN_CONNS=10
DB_MAX_IDLE_CONNS=3
DB_CONN_MAX_LIFETIME=30m
DB_CONN_MAX_IDLE_TIME=5m

# Railway Pro Tier (Higher limits)
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=5
DB_CONN_MAX_LIFETIME=1h
DB_CONN_MAX_IDLE_TIME=10m
```

## Database Connection Pool Settings

### DB_MAX_OPEN_CONNS
**Code Default:** `5`
**Recommended for Railway Free Tier:** `10`
Maximum number of open connections to the database.

### DB_MAX_IDLE_CONNS
**Code Default:** `2`
**Recommended for Railway Free Tier:** `3`
Maximum number of idle connections that should be maintained.

### DB_CONN_MAX_LIFETIME
**Code Default:** `30m`
**Recommended for Railway Free Tier:** `30m` (same as default)
Maximum lifetime of a connection. Refresh connections periodically to prevent stale connections.

### DB_CONN_MAX_IDLE_TIME
**Code Default:** `5m`
**Recommended for Railway Free Tier:** `5m` (same as default)
Maximum idle time before a connection is closed. Helps keep the database active on Railway.
