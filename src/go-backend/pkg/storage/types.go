package storage

// UploadResult represents the result of a successful file upload.
type UploadResult struct {
	URL      string // Public URL to access the file
	Key      string // Storage key/path for the file
	Size     int64  // File size in bytes
	MimeType string // MIME type of the uploaded file
}

// FileInfo represents metadata about a stored file.
type FileInfo struct {
	Key      string
	Size     int64
	MimeType string
	ModTime  string // ISO 8601 timestamp
}
