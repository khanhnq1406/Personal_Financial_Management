//go:build integration
// +build integration

package fileupload

import (
	"bytes"
	"context"
	"mime/multipart"
	"os"
	"testing"

	"wealthjourney/pkg/storage"
)

func TestFileUploadService_Integration(t *testing.T) {
	// Load Supabase credentials
	baseURL := os.Getenv("SUPABASE_URL")
	apiKey := os.Getenv("SUPABASE_API_KEY")
	bucket := os.Getenv("SUPABASE_BUCKET")

	if baseURL == "" || apiKey == "" || bucket == "" {
		t.Skip("Skipping integration test: Supabase credentials not set")
	}

	// Create storage provider and service
	storageProvider := storage.NewSupabaseStorage(baseURL, apiKey, bucket)
	service := NewFileUploadService(storageProvider)

	ctx := context.Background()

	t.Run("Upload CSV", func(t *testing.T) {
		// Create test CSV content
		csvContent := []byte("Date,Amount,Description\n2024-01-01,100,Test transaction")
		mockFile := &mockFile{Reader: bytes.NewReader(csvContent)}

		header := &multipart.FileHeader{
			Filename: "integration-test.csv",
			Size:     int64(len(csvContent)),
		}

		// Upload
		result, err := service.Upload(ctx, mockFile, header)
		if err != nil {
			t.Fatalf("Upload failed: %v", err)
		}

		// Verify result
		if result.FileType != FileTypeCSV {
			t.Errorf("Expected FileTypeCSV, got %s", result.FileType)
		}

		if result.FilePath == "" {
			t.Error("FilePath (URL) should not be empty")
		}

		t.Logf("Uploaded file URL: %s", result.FilePath)

		// Cleanup
		defer service.Cleanup(ctx, result.FileID, ".csv")
	})

	t.Run("Upload Excel", func(t *testing.T) {
		// Minimal Excel content (not valid, but tests upload)
		excelContent := []byte("PK\x03\x04") // Excel file signature
		mockFile := &mockFile{Reader: bytes.NewReader(excelContent)}

		header := &multipart.FileHeader{
			Filename: "integration-test.xlsx",
			Size:     int64(len(excelContent)),
		}

		result, err := service.Upload(ctx, mockFile, header)
		if err != nil {
			t.Fatalf("Upload failed: %v", err)
		}

		if result.FileType != FileTypeExcel {
			t.Errorf("Expected FileTypeExcel, got %s", result.FileType)
		}

		t.Logf("Uploaded Excel URL: %s", result.FilePath)

		defer service.Cleanup(ctx, result.FileID, ".xlsx")
	})

	t.Run("Upload PDF", func(t *testing.T) {
		// Minimal PDF content
		pdfContent := []byte("%PDF-1.4\n") // PDF header
		mockFile := &mockFile{Reader: bytes.NewReader(pdfContent)}

		header := &multipart.FileHeader{
			Filename: "integration-test.pdf",
			Size:     int64(len(pdfContent)),
		}

		result, err := service.Upload(ctx, mockFile, header)
		if err != nil {
			t.Fatalf("Upload failed: %v", err)
		}

		if result.FileType != FileTypePDF {
			t.Errorf("Expected FileTypePDF, got %s", result.FileType)
		}

		t.Logf("Uploaded PDF URL: %s", result.FilePath)

		defer service.Cleanup(ctx, result.FileID, ".pdf")
	})

	t.Run("Upload and Cleanup", func(t *testing.T) {
		csvContent := []byte("test,data\n1,2")
		mockFile := &mockFile{Reader: bytes.NewReader(csvContent)}

		header := &multipart.FileHeader{
			Filename: "cleanup-test.csv",
			Size:     int64(len(csvContent)),
		}

		// Upload
		result, err := service.Upload(ctx, mockFile, header)
		if err != nil {
			t.Fatalf("Upload failed: %v", err)
		}

		t.Logf("Uploaded file for cleanup test: %s", result.FilePath)

		// Cleanup
		err = service.Cleanup(ctx, result.FileID, ".csv")
		if err != nil {
			t.Errorf("Cleanup failed: %v", err)
		}

		t.Log("File cleaned up successfully")
	})
}
