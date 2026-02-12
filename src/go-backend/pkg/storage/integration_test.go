//go:build integration
// +build integration

package storage

import (
	"bytes"
	"context"
	"os"
	"testing"
)

// TestSupabaseStorage_Integration tests real Supabase Storage operations.
// Run with: go test -tags=integration ./pkg/storage/...
func TestSupabaseStorage_Integration(t *testing.T) {
	// Load credentials from environment
	baseURL := os.Getenv("SUPABASE_URL")
	apiKey := os.Getenv("SUPABASE_API_KEY")
	bucket := os.Getenv("SUPABASE_BUCKET")

	if baseURL == "" || apiKey == "" || bucket == "" {
		t.Skip("Skipping integration test: SUPABASE_URL, SUPABASE_API_KEY, or SUPABASE_BUCKET not set")
	}

	storage := NewSupabaseStorage(baseURL, apiKey, bucket)
	ctx := context.Background()

	// Test data
	testContent := []byte("Integration test file content")
	testKey := "integration-test/test-file.txt"

	// Test Upload
	t.Run("Upload", func(t *testing.T) {
		result, err := storage.Upload(ctx, bytes.NewReader(testContent), testKey, "text/plain")
		if err != nil {
			t.Fatalf("Upload failed: %v", err)
		}

		if result.Key != testKey {
			t.Errorf("Expected key %s, got %s", testKey, result.Key)
		}

		if result.Size != int64(len(testContent)) {
			t.Errorf("Expected size %d, got %d", len(testContent), result.Size)
		}

		t.Logf("Uploaded file URL: %s", result.URL)
	})

	// Test GetURL
	t.Run("GetURL", func(t *testing.T) {
		url, err := storage.GetURL(ctx, testKey)
		if err != nil {
			t.Fatalf("GetURL failed: %v", err)
		}

		if url == "" {
			t.Error("URL should not be empty")
		}

		t.Logf("File URL: %s", url)
	})

	// Test Delete
	t.Run("Delete", func(t *testing.T) {
		err := storage.Delete(ctx, testKey)
		if err != nil {
			t.Fatalf("Delete failed: %v", err)
		}

		t.Log("File deleted successfully")
	})

	// Test Delete non-existent file (should not error)
	t.Run("Delete Non-existent", func(t *testing.T) {
		err := storage.Delete(ctx, "non-existent-file.txt")
		if err != nil {
			t.Errorf("Delete non-existent file should not error, got: %v", err)
		}
	})
}
