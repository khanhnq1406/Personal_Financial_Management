package fileupload

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"wealthjourney/pkg/storage"
)

const (
	MaxCSVSize   = 10 * 1024 * 1024 // 10MB
	MaxExcelSize = 10 * 1024 * 1024 // 10MB
	MaxPDFSize   = 20 * 1024 * 1024 // 20MB
	UploadDir    = "/tmp/wealthjourney-uploads"
)

// Global service instance (for backward compatibility)
var defaultService *FileUploadService

// InitializeDefaultService sets up the default file upload service.
// This should be called during application startup.
func InitializeDefaultService(storageProvider storage.StorageProvider) {
	defaultService = NewFileUploadService(storageProvider)
}

type FileType string

const (
	FileTypeCSV   FileType = "csv"
	FileTypeExcel FileType = "excel"
	FileTypePDF   FileType = "pdf"
)

type UploadResult struct {
	FileID   string
	FileName string
	FileType FileType
	FileSize int64
	FilePath string
}

func UploadFile(file multipart.File, header *multipart.FileHeader) (*UploadResult, error) {
	// Use new service if initialized
	if defaultService != nil {
		return defaultService.Upload(context.Background(), file, header)
	}

	// Fallback to old implementation (for backward compatibility during migration)
	// Validate file type
	fileType, err := ValidateFileType(header.Filename)
	if err != nil {
		return nil, err
	}

	// Validate file size
	if err := ValidateFileSize(header.Size, fileType); err != nil {
		return nil, err
	}

	// Generate unique file ID
	fileID := uuid.New().String()
	ext := filepath.Ext(header.Filename)
	destPath := filepath.Join(UploadDir, fileID+ext)

	// Ensure upload directory exists
	if err := os.MkdirAll(UploadDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create upload directory: %w", err)
	}

	// Create destination file
	destFile, err := os.Create(destPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create destination file: %w", err)
	}
	defer destFile.Close()

	// Copy uploaded file to destination
	if _, err := io.Copy(destFile, file); err != nil {
		os.Remove(destPath) // Clean up on error
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	return &UploadResult{
		FileID:   fileID,
		FileName: header.Filename,
		FileType: fileType,
		FileSize: header.Size,
		FilePath: destPath,
	}, nil
}

func UploadFileFromBytes(fileData []byte, fileName string, fileSize int64) (*UploadResult, error) {
	// Use new service if initialized
	if defaultService != nil {
		return defaultService.UploadFromBytes(context.Background(), fileData, fileName, fileSize)
	}

	// Fallback to old implementation (for backward compatibility during migration)
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

	// Generate unique file ID
	fileID := uuid.New().String()
	ext := filepath.Ext(fileName)
	destPath := filepath.Join(UploadDir, fileID+ext)

	// Ensure upload directory exists
	if err := os.MkdirAll(UploadDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create upload directory: %w", err)
	}

	// Write file data to destination
	if err := os.WriteFile(destPath, fileData, 0644); err != nil {
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	return &UploadResult{
		FileID:   fileID,
		FileName: fileName,
		FileType: fileType,
		FileSize: fileSize,
		FilePath: destPath,
	}, nil
}

func CleanupFile(fileID string) error {
	// Use new service if initialized
	if defaultService != nil {
		// Try common extensions
		for _, ext := range []string{".csv", ".xlsx", ".xls", ".pdf"} {
			_ = defaultService.Cleanup(context.Background(), fileID, ext)
		}
		return nil
	}

	// Fallback to old implementation (for backward compatibility during migration)
	// Find and delete file with any extension
	matches, err := filepath.Glob(filepath.Join(UploadDir, fileID+".*"))
	if err != nil {
		return err
	}

	for _, match := range matches {
		if err := os.Remove(match); err != nil {
			return err
		}
	}

	return nil
}

// FileInfo represents metadata about an uploaded file
type FileInfo struct {
	Path    string
	ModTime os.FileInfo
	Size    int64
}

// ListFiles returns all uploaded files with metadata
func ListFiles(uploadDir string) ([]FileInfo, error) {
	var files []FileInfo

	entries, err := os.ReadDir(uploadDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read upload directory: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			// Log warning but continue with other files
			fmt.Printf("WARN: Failed to get info for file %s: %v\n", entry.Name(), err)
			continue
		}

		files = append(files, FileInfo{
			Path:    filepath.Join(uploadDir, entry.Name()),
			ModTime: info,
			Size:    info.Size(),
		})
	}

	return files, nil
}

// DeleteFile removes a file from disk
func DeleteFile(filePath string) error {
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete file %s: %w", filePath, err)
	}
	return nil
}
