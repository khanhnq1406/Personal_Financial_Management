package fileupload

import (
	"fmt"
	"path/filepath"
	"strings"
)

func ValidateFileType(filename string) (FileType, error) {
	ext := strings.ToLower(filepath.Ext(filename))

	switch ext {
	case ".csv":
		return FileTypeCSV, nil
	case ".xlsx", ".xls":
		return FileTypeExcel, nil
	case ".pdf":
		return FileTypePDF, nil
	default:
		return "", fmt.Errorf("unsupported file type: %s. Supported: CSV, Excel (.xlsx, .xls), PDF", ext)
	}
}

func ValidateFileSize(size int64, fileType FileType) error {
	var maxSize int64

	switch fileType {
	case FileTypeCSV:
		maxSize = MaxCSVSize
	case FileTypeExcel:
		maxSize = MaxExcelSize
	case FileTypePDF:
		maxSize = MaxPDFSize
	default:
		return fmt.Errorf("unknown file type")
	}

	if size > maxSize {
		return fmt.Errorf("file size %d bytes exceeds maximum %d bytes", size, maxSize)
	}

	if size == 0 {
		return fmt.Errorf("file is empty")
	}

	return nil
}
