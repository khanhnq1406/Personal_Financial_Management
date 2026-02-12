package storage

import (
	"context"
	"io"
)

// StorageProvider defines the interface for file storage operations.
// This abstraction allows swapping between different storage backends
// (local filesystem, Supabase, S3, etc.) without changing business logic.
type StorageProvider interface {
	// Upload stores a file and returns its metadata.
	// key: storage path/identifier (e.g., "uploads/user-123/file.csv")
	// contentType: MIME type (e.g., "text/csv", "application/pdf")
	Upload(ctx context.Context, file io.Reader, key string, contentType string) (*UploadResult, error)

	// Delete removes a file from storage.
	Delete(ctx context.Context, key string) error

	// GetURL returns the public URL for accessing a stored file.
	// For private storage, this may return a signed/temporary URL.
	GetURL(ctx context.Context, key string) (string, error)
}
