package fileupload

import (
	"testing"
)

func TestValidateFileType(t *testing.T) {
	tests := []struct {
		filename    string
		expected    FileType
		expectError bool
	}{
		{"statement.csv", FileTypeCSV, false},
		{"statement.xlsx", FileTypeExcel, false},
		{"statement.xls", FileTypeExcel, false},
		{"statement.pdf", FileTypePDF, false},
		{"statement.txt", "", true},
		{"statement.doc", "", true},
		{"statement", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.filename, func(t *testing.T) {
			fileType, err := ValidateFileType(tt.filename)
			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error for %s, got none", tt.filename)
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error for %s, got: %v", tt.filename, err)
				}
				if fileType != tt.expected {
					t.Errorf("Expected %s for %s, got %s", tt.expected, tt.filename, fileType)
				}
			}
		})
	}
}

func TestValidateFileSize(t *testing.T) {
	tests := []struct {
		name        string
		size        int64
		fileType    FileType
		expectError bool
	}{
		{"CSV valid size", 5 * 1024 * 1024, FileTypeCSV, false},
		{"CSV too large", 11 * 1024 * 1024, FileTypeCSV, true},
		{"CSV empty", 0, FileTypeCSV, true},
		{"Excel valid size", 8 * 1024 * 1024, FileTypeExcel, false},
		{"Excel too large", 11 * 1024 * 1024, FileTypeExcel, true},
		{"PDF valid size", 15 * 1024 * 1024, FileTypePDF, false},
		{"PDF too large", 21 * 1024 * 1024, FileTypePDF, true},
		{"PDF empty", 0, FileTypePDF, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateFileSize(tt.size, tt.fileType)
			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error for %s, got none", tt.name)
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error for %s, got: %v", tt.name, err)
				}
			}
		})
	}
}
