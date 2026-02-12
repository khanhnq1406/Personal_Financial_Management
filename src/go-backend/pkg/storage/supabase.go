package storage

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path"
)

// Compile-time check to ensure SupabaseStorage implements StorageProvider.
var _ StorageProvider = (*SupabaseStorage)(nil)

// SupabaseStorage implements StorageProvider for Supabase Storage.
type SupabaseStorage struct {
	baseURL string // e.g., "https://xxx.supabase.co"
	apiKey  string // Service role key or anon key
	bucket  string // Bucket name
	client  *http.Client
}

// NewSupabaseStorage creates a new Supabase storage provider.
func NewSupabaseStorage(baseURL, apiKey, bucket string) *SupabaseStorage {
	return &SupabaseStorage{
		baseURL: baseURL,
		apiKey:  apiKey,
		bucket:  bucket,
		client:  &http.Client{},
	}
}

// Upload uploads a file to Supabase Storage.
func (s *SupabaseStorage) Upload(ctx context.Context, file io.Reader, key string, contentType string) (*UploadResult, error) {
	// Read file content to get size
	fileContent, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("failed to read file content: %w", err)
	}
	fileSize := int64(len(fileContent))

	// Build upload URL
	uploadURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.baseURL, s.bucket, key)

	// Create request
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, uploadURL, bytes.NewReader(fileContent))
	if err != nil {
		return nil, fmt.Errorf("failed to create upload request: %w", err)
	}

	// Set headers
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", contentType)

	// Execute request
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to upload file: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("upload failed with status %d: %s", resp.StatusCode, string(body))
	}

	// Generate public URL
	publicURL, err := s.GetURL(ctx, key)
	if err != nil {
		return nil, fmt.Errorf("failed to generate public URL: %w", err)
	}

	return &UploadResult{
		URL:      publicURL,
		Key:      key,
		Size:     fileSize,
		MimeType: contentType,
	}, nil
}

// Delete removes a file from Supabase Storage.
func (s *SupabaseStorage) Delete(ctx context.Context, key string) error {
	deleteURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.baseURL, s.bucket, key)

	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, deleteURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create delete request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}
	defer resp.Body.Close()

	// 404 is acceptable (file already deleted or never existed)
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusNotFound {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("delete failed with status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// GetURL returns a signed URL for accessing a private file.
// For private buckets, this generates a temporary signed URL that expires in 24 hours.
func (s *SupabaseStorage) GetURL(ctx context.Context, key string) (string, error) {
	// Try to generate a signed URL (for private buckets)
	// POST /storage/v1/object/sign/{bucket}/{key}
	signURL := fmt.Sprintf("%s/storage/v1/object/sign/%s/%s", s.baseURL, s.bucket, key)
	fmt.Printf("[DEBUG] GetURL: Requesting signed URL for key=%s, signURL=%s\n", key, signURL)

	// Request body: {"expiresIn": 86400} (24 hours in seconds)
	reqBody := bytes.NewBufferString(`{"expiresIn": 86400}`)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, signURL, reqBody)
	if err != nil {
		fmt.Printf("[DEBUG] GetURL: Failed to create request: %v\n", err)
		return "", fmt.Errorf("failed to create sign request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		fmt.Printf("[DEBUG] GetURL: Request failed: %v\n", err)
		return "", fmt.Errorf("failed to generate signed URL: %w", err)
	}
	defer resp.Body.Close()

	// Read response body for debugging
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("[DEBUG] GetURL: Failed to read response body: %v\n", err)
		return "", fmt.Errorf("failed to read sign response: %w", err)
	}

	fmt.Printf("[DEBUG] GetURL: Response status=%d, body=%s\n", resp.StatusCode, string(body))

	if resp.StatusCode != http.StatusOK {
		// Check if it's a 404 (file not found) - return error so we can try other extensions
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusNotFound {
			// Check if the response indicates "not_found"
			if bytes.Contains(body, []byte("not_found")) || bytes.Contains(body, []byte("Object not found")) {
				fmt.Printf("[DEBUG] GetURL: File not found (404), returning error to try next extension\n")
				return "", fmt.Errorf("file not found: %s", key)
			}
		}

		// For other errors (auth, permissions, etc.), fall back to public URL
		publicURL := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", s.baseURL, s.bucket, key)
		fmt.Printf("[DEBUG] GetURL: Signing failed (non-404 error), falling back to public URL: %s\n", publicURL)
		return publicURL, nil
	}

	// Parse response to get signed URL
	var result struct {
		SignedURL string `json:"signedURL"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		fmt.Printf("[DEBUG] GetURL: Failed to parse JSON response: %v\n", err)
		return "", fmt.Errorf("failed to parse sign response: %w", err)
	}

	// Reconstruct full signed URL
	// The signedURL from Supabase is like "/object/sign/..." so we need to add "/storage/v1" prefix
	fullSignedURL := fmt.Sprintf("%s/storage/v1%s", s.baseURL, result.SignedURL)
	fmt.Printf("[DEBUG] GetURL: Successfully generated signed URL: %s\n", fullSignedURL)
	return fullSignedURL, nil
}

// GetMimeType returns MIME type based on file extension.
func GetMimeType(filename string) string {
	ext := path.Ext(filename)
	switch ext {
	case ".csv":
		return "text/csv"
	case ".xlsx":
		return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	case ".xls":
		return "application/vnd.ms-excel"
	case ".pdf":
		return "application/pdf"
	default:
		return "application/octet-stream"
	}
}
