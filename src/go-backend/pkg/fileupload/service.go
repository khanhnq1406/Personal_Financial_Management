package fileupload

import (
	"bytes"
	"context"
	"fmt"
	"mime/multipart"
	"path/filepath"

	"github.com/google/uuid"
	"wealthjourney/pkg/storage"
)

// FileUploadService handles file upload operations using a storage provider.
type FileUploadService struct {
	storage storage.StorageProvider
}

// NewFileUploadService creates a new file upload service.
func NewFileUploadService(storageProvider storage.StorageProvider) *FileUploadService {
	return &FileUploadService{
		storage: storageProvider,
	}
}

// Upload uploads a file using the configured storage provider.
func (s *FileUploadService) Upload(ctx context.Context, file multipart.File, header *multipart.FileHeader) (*UploadResult, error) {
	// Validate file type
	fileType, err := ValidateFileType(header.Filename)
	if err != nil {
		return nil, err
	}

	// Validate file size
	if err := ValidateFileSize(header.Size, fileType); err != nil {
		return nil, err
	}

	// Generate unique file ID and storage key
	fileID := uuid.New().String()
	ext := filepath.Ext(header.Filename)
	storageKey := fmt.Sprintf("uploads/%s%s", fileID, ext)

	// Determine MIME type
	mimeType := storage.GetMimeType(header.Filename)

	// Upload to storage
	result, err := s.storage.Upload(ctx, file, storageKey, mimeType)
	if err != nil {
		return nil, fmt.Errorf("failed to upload file: %w", err)
	}

	return &UploadResult{
		FileID:   fileID,
		FileName: header.Filename,
		FileType: fileType,
		FileSize: header.Size,
		FilePath: result.URL, // Store the public URL
	}, nil
}

// UploadFromBytes uploads file content from bytes.
func (s *FileUploadService) UploadFromBytes(ctx context.Context, fileData []byte, fileName string, fileSize int64) (*UploadResult, error) {
	// Validate file type
	fileType, err := ValidateFileType(fileName)
	if err != nil {
		return nil, err
	}

	// Validate size match
	if err := ValidateFileSizeMatch(fileSize, fileData); err != nil {
		return nil, err
	}

	// Validate file size
	if err := ValidateFileSize(fileSize, fileType); err != nil {
		return nil, err
	}

	// Generate unique file ID and storage key
	fileID := uuid.New().String()
	ext := filepath.Ext(fileName)
	storageKey := fmt.Sprintf("uploads/%s%s", fileID, ext)

	// Determine MIME type
	mimeType := storage.GetMimeType(fileName)

	// Upload to storage
	result, err := s.storage.Upload(ctx, bytes.NewReader(fileData), storageKey, mimeType)
	if err != nil {
		return nil, fmt.Errorf("failed to upload file: %w", err)
	}

	return &UploadResult{
		FileID:   fileID,
		FileName: fileName,
		FileType: fileType,
		FileSize: fileSize,
		FilePath: result.URL,
	}, nil
}

// Cleanup removes a file from storage.
func (s *FileUploadService) Cleanup(ctx context.Context, fileID string, extension string) error {
	storageKey := fmt.Sprintf("uploads/%s%s", fileID, extension)
	return s.storage.Delete(ctx, storageKey)
}
