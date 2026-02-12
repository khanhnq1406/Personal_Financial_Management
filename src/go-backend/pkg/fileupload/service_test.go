package fileupload

import (
	"bytes"
	"context"
	"io"
	"mime/multipart"
	"testing"

	"wealthjourney/pkg/storage"
)

// mockStorageProvider for testing
type mockStorageProvider struct {
	uploadFunc func(ctx context.Context, file io.Reader, key string, contentType string) (*storage.UploadResult, error)
	deleteFunc func(ctx context.Context, key string) error
	getURLFunc func(ctx context.Context, key string) (string, error)
}

func (m *mockStorageProvider) Upload(ctx context.Context, file io.Reader, key string, contentType string) (*storage.UploadResult, error) {
	if m.uploadFunc != nil {
		return m.uploadFunc(ctx, file, key, contentType)
	}
	return &storage.UploadResult{
		URL:      "https://example.com/" + key,
		Key:      key,
		Size:     100,
		MimeType: contentType,
	}, nil
}

func (m *mockStorageProvider) Delete(ctx context.Context, key string) error {
	if m.deleteFunc != nil {
		return m.deleteFunc(ctx, key)
	}
	return nil
}

func (m *mockStorageProvider) GetURL(ctx context.Context, key string) (string, error) {
	if m.getURLFunc != nil {
		return m.getURLFunc(ctx, key)
	}
	return "https://example.com/" + key, nil
}

func TestFileUploadService_Upload(t *testing.T) {
	mockStorage := &mockStorageProvider{}
	service := NewFileUploadService(mockStorage)

	// Create mock file
	fileContent := []byte("test,data\n1,2")
	file := newMockFile(string(fileContent))

	header := &multipart.FileHeader{
		Filename: "test.csv",
		Size:     int64(len(fileContent)),
	}

	result, err := service.Upload(context.Background(), file, header)
	if err != nil {
		t.Fatalf("Upload failed: %v", err)
	}

	if result.FileName != "test.csv" {
		t.Errorf("Expected filename 'test.csv', got %s", result.FileName)
	}

	if result.FileType != FileTypeCSV {
		t.Errorf("Expected FileTypeCSV, got %s", result.FileType)
	}

	// FilePath should now be a URL
	if result.FilePath == "" {
		t.Error("FilePath (URL) should not be empty")
	}
}

func TestFileUploadService_UploadFromBytes(t *testing.T) {
	mockStorage := &mockStorageProvider{}
	service := NewFileUploadService(mockStorage)

	fileContent := []byte("test,data\n1,2")
	fileName := "test.csv"
	fileSize := int64(len(fileContent))

	result, err := service.UploadFromBytes(context.Background(), fileContent, fileName, fileSize)
	if err != nil {
		t.Fatalf("UploadFromBytes failed: %v", err)
	}

	if result.FileName != fileName {
		t.Errorf("Expected filename '%s', got %s", fileName, result.FileName)
	}

	if result.FileType != FileTypeCSV {
		t.Errorf("Expected FileTypeCSV, got %s", result.FileType)
	}

	if result.FilePath == "" {
		t.Error("FilePath (URL) should not be empty")
	}
}

func TestFileUploadService_Cleanup(t *testing.T) {
	deleteCalled := false
	mockStorage := &mockStorageProvider{
		deleteFunc: func(ctx context.Context, key string) error {
			deleteCalled = true
			if key != "uploads/test-file-id.csv" {
				t.Errorf("Expected key 'uploads/test-file-id.csv', got %s", key)
			}
			return nil
		},
	}

	service := NewFileUploadService(mockStorage)

	err := service.Cleanup(context.Background(), "test-file-id", ".csv")
	if err != nil {
		t.Fatalf("Cleanup failed: %v", err)
	}

	if !deleteCalled {
		t.Error("Delete was not called")
	}
}

func TestFileUploadService_Upload_InvalidFileType(t *testing.T) {
	mockStorage := &mockStorageProvider{}
	service := NewFileUploadService(mockStorage)

	fileContent := []byte("test data")
	mockFile := &mockFile{Reader: bytes.NewReader(fileContent)}

	header := &multipart.FileHeader{
		Filename: "test.txt", // Invalid type
		Size:     int64(len(fileContent)),
	}

	_, err := service.Upload(context.Background(), mockFile, header)
	if err == nil {
		t.Error("Expected error for invalid file type, got nil")
	}
}

func TestFileUploadService_Upload_FileTooLarge(t *testing.T) {
	mockStorage := &mockStorageProvider{}
	service := NewFileUploadService(mockStorage)

	fileContent := []byte("test,data\n1,2")
	mockFile := &mockFile{Reader: bytes.NewReader(fileContent)}

	header := &multipart.FileHeader{
		Filename: "test.csv",
		Size:     MaxCSVSize + 1, // Too large
	}

	_, err := service.Upload(context.Background(), mockFile, header)
	if err == nil {
		t.Error("Expected error for file too large, got nil")
	}
}
