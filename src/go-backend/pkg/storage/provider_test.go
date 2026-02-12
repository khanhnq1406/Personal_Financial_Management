package storage

import (
	"context"
	"io"
	"testing"
)

func TestStorageProvider_Interface(t *testing.T) {
	// This test verifies that our interface is well-defined
	// Actual implementations will be tested separately

	var _ StorageProvider = (*mockStorage)(nil)
}

type mockStorage struct {
	uploadFunc func(ctx context.Context, file io.Reader, key string, contentType string) (*UploadResult, error)
	deleteFunc func(ctx context.Context, key string) error
	getURLFunc func(ctx context.Context, key string) (string, error)
}

func (m *mockStorage) Upload(ctx context.Context, file io.Reader, key string, contentType string) (*UploadResult, error) {
	return m.uploadFunc(ctx, file, key, contentType)
}

func (m *mockStorage) Delete(ctx context.Context, key string) error {
	return m.deleteFunc(ctx, key)
}

func (m *mockStorage) GetURL(ctx context.Context, key string) (string, error) {
	return m.getURLFunc(ctx, key)
}

func TestUploadResult_Structure(t *testing.T) {
	result := &UploadResult{
		URL:      "https://example.com/file.csv",
		Key:      "uploads/abc-123.csv",
		Size:     1024,
		MimeType: "text/csv",
	}

	if result.URL == "" {
		t.Error("URL should not be empty")
	}
	if result.Key == "" {
		t.Error("Key should not be empty")
	}
}
