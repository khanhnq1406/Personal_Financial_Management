package fileupload

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"

	"github.com/google/uuid"
)

const (
	MaxCSVSize   = 10 * 1024 * 1024 // 10MB
	MaxExcelSize = 10 * 1024 * 1024 // 10MB
	MaxPDFSize   = 20 * 1024 * 1024 // 20MB
	UploadDir    = "/tmp/wealthjourney-uploads"
)

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

func CleanupFile(fileID string) error {
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
