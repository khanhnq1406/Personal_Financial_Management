package config

import (
	"os"
	"testing"
)

func TestLoadConfig_SupabaseStorage(t *testing.T) {
	// Set environment variables for test
	os.Setenv("JWT_SECRET", "test-secret-key-12345")
	os.Setenv("SUPABASE_URL", "https://test.supabase.co")
	os.Setenv("SUPABASE_API_KEY", "test-api-key")
	os.Setenv("SUPABASE_BUCKET", "test-bucket")
	defer func() {
		os.Unsetenv("JWT_SECRET")
		os.Unsetenv("SUPABASE_URL")
		os.Unsetenv("SUPABASE_API_KEY")
		os.Unsetenv("SUPABASE_BUCKET")
	}()

	// This will fail until we add Storage config
	cfg, err := Load()
	if err != nil {
		t.Fatalf("Failed to load config: %v", err)
	}

	if cfg.Storage.SupabaseURL != "https://test.supabase.co" {
		t.Errorf("Expected SupabaseURL to be 'https://test.supabase.co', got %s", cfg.Storage.SupabaseURL)
	}

	if cfg.Storage.SupabaseAPIKey != "test-api-key" {
		t.Errorf("Expected SupabaseAPIKey to be 'test-api-key', got %s", cfg.Storage.SupabaseAPIKey)
	}

	if cfg.Storage.SupabaseBucket != "test-bucket" {
		t.Errorf("Expected SupabaseBucket to be 'test-bucket', got %s", cfg.Storage.SupabaseBucket)
	}
}
