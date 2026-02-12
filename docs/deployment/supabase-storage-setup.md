# Supabase Storage Setup Guide

This guide walks through setting up Supabase Storage for WealthJourney file uploads.

## Prerequisites

- Supabase account (free tier available)
- Supabase project created

## Step 1: Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create new bucket**
4. Configure bucket:
   - **Name**: `wealthjourney-uploads`
   - **Public bucket**: Enable (for public file access)
   - **File size limit**: 20MB (to match PDF limit)
   - **Allowed MIME types**:
     - `text/csv`
     - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
     - `application/vnd.ms-excel`
     - `application/pdf`

5. Click **Create bucket**

## Step 2: Configure Bucket Policies

By default, public buckets allow read access but not write. We need to add policies for authenticated uploads.

1. Go to **Storage** → **Policies**
2. Click on `wealthjourney-uploads` bucket
3. Add the following policies:

### Policy 1: Allow Service Role to Upload

```sql
CREATE POLICY "Service role can upload files"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'wealthjourney-uploads');
```

### Policy 2: Allow Service Role to Delete

```sql
CREATE POLICY "Service role can delete files"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'wealthjourney-uploads');
```

### Policy 3: Public Read Access

```sql
CREATE POLICY "Public can read files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'wealthjourney-uploads');
```

## Step 3: Get API Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://[project-id].supabase.co`
   - **Service Role Key**: `eyJ...` (keep this secret!)

## Step 4: Configure Application

Update your `.env.local` or production environment variables:

```bash
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://[your-project-id].supabase.co
SUPABASE_API_KEY=[your-service-role-key]
SUPABASE_BUCKET=wealthjourney-uploads
```

**Important Security Notes:**

- **Never commit** `SUPABASE_API_KEY` to version control
- Use **Service Role Key** for backend operations (not anon key)
- Service role key bypasses RLS, so only use server-side
- For Railway/Vercel, add these as environment variables in dashboard

## Step 5: Test Upload

1. Start your backend server:
   ```bash
   cd src/go-backend && go run cmd/server/main.go
   ```

2. Check startup logs for:
   ```
   Initializing Supabase storage...
   Supabase storage initialized (bucket: wealthjourney-uploads)
   File upload service initialized with external storage
   ```

3. Upload a test file through the API:
   ```bash
   curl -X POST http://localhost:8080/api/v1/import/upload \
     -H "Authorization: Bearer [your-jwt-token]" \
     -F "file=@test.csv"
   ```

4. Verify file appears in Supabase Storage dashboard

## Storage Limits (Free Tier)

- **Storage**: 1 GB
- **Bandwidth**: 2 GB/month
- **File uploads**: Unlimited

For production, monitor usage in Supabase dashboard under **Settings** → **Usage**.

## Cleanup Old Files

To prevent storage bloat, run periodic cleanup:

```bash
# Manual cleanup (example)
curl -X POST http://localhost:8080/api/v1/admin/cleanup-expired-files \
  -H "Authorization: Bearer [admin-token]"
```

The cleanup job removes files older than 1 hour that are no longer referenced in the database.

## Troubleshooting

### Upload fails with 401 Unauthorized

- Verify `SUPABASE_API_KEY` is the **Service Role Key**, not anon key
- Check that policies allow service_role to insert

### Upload fails with 403 Forbidden

- Verify bucket policies are correctly configured
- Check that bucket name matches `SUPABASE_BUCKET` env variable

### Files not accessible (404)

- Ensure bucket is set to **Public**
- Verify public read policy exists
- Check that file path matches the stored key

### Downloads slow or timing out

- Consider enabling Supabase CDN (Pro plan)
- For large files, implement streaming downloads instead of reading entire file

## Migration from Local Storage

If migrating from existing local storage:

1. Deploy new version with Supabase storage
2. Existing local files will continue to work (backward compatible)
3. New uploads will use Supabase
4. Optionally migrate old files:
   ```bash
   # Run migration script (to be implemented)
   go run cmd/migrate-files-to-supabase/main.go
   ```

## Cost Estimation

For 1000 users uploading ~10 files/month:
- **Storage needed**: ~500 MB (0.5 GB)
- **Bandwidth**: ~2 GB/month downloads
- **Verdict**: Free tier sufficient

For scaling beyond free tier, Supabase Pro is $25/month with 100GB storage and 200GB bandwidth.
