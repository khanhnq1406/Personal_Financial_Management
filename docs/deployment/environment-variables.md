# Environment Variables Reference

Complete reference for all environment variables used by WealthJourney.

## Storage Configuration

### STORAGE_PROVIDER

**Type:** String
**Default:** `supabase`
**Options:** `supabase`, `local`
**Description:** Determines which storage backend to use for uploaded files.

- `supabase`: Use Supabase Storage (recommended for production)
- `local`: Use local filesystem (ephemeral on Railway/Vercel, only for dev)

**Example:**
```bash
STORAGE_PROVIDER=supabase
```

### SUPABASE_URL

**Type:** URL
**Required:** Yes (if STORAGE_PROVIDER=supabase)
**Description:** Your Supabase project URL.

**Example:**
```bash
SUPABASE_URL=https://abcdefgh.supabase.co
```

**How to get:**
1. Go to Supabase dashboard
2. Navigate to Settings → API
3. Copy "Project URL"

### SUPABASE_API_KEY

**Type:** String (JWT)
**Required:** Yes (if STORAGE_PROVIDER=supabase)
**Security:** ⚠️ KEEP SECRET - Never commit to version control
**Description:** Supabase Service Role key for backend operations.

**Example:**
```bash
SUPABASE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**How to get:**
1. Go to Supabase dashboard
2. Navigate to Settings → API
3. Copy "**Service Role Key**" (NOT anon key)

**Important:**
- Use Service Role key for backend (bypasses RLS)
- Never expose this key in frontend code
- Rotate key if compromised

### SUPABASE_BUCKET

**Type:** String
**Default:** `wealthjourney-uploads`
**Description:** Name of the Supabase Storage bucket.

**Example:**
```bash
SUPABASE_BUCKET=wealthjourney-uploads
```

Must match the bucket name created in Supabase Storage dashboard.

### UPLOAD_DIR

**Type:** File path
**Default:** `/tmp/wealthjourney-uploads`
**Description:** Local directory for file uploads (only used if STORAGE_PROVIDER=local).

**Example:**
```bash
UPLOAD_DIR=/var/wealthjourney/uploads
```

**Note:** On Railway/Vercel, this directory is ephemeral and cleared on restart.

## Deployment Platform-Specific

### Railway

Add in Railway dashboard under Variables:

```bash
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_API_KEY=eyJ...
SUPABASE_BUCKET=wealthjourney-uploads
```

### Vercel

Add in Vercel dashboard under Environment Variables:

```bash
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_API_KEY=eyJ...
SUPABASE_BUCKET=wealthjourney-uploads
```

## Validation

After setting environment variables, verify with:

```bash
cd src/go-backend && go run cmd/server/main.go
```

Look for startup logs:
```
Initializing Supabase storage...
Supabase storage initialized (bucket: wealthjourney-uploads)
File upload service initialized with external storage
```

If you see:
```
Warning: Unknown storage provider 'xxx', file uploads will use legacy local storage
```

Check that `STORAGE_PROVIDER` is set correctly and Supabase credentials are valid.
