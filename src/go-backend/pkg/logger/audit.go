package logger

import (
	"context"
	"encoding/json"
	"log"
	"time"
)

// ImportAuditLog represents a comprehensive audit log entry for import operations.
// This includes full context needed for compliance, forensics, and monitoring.
type ImportAuditLog struct {
	// User and resource identifiers
	UserID    int32  `json:"user_id"`
	WalletID  int32  `json:"wallet_id"`
	Action    string `json:"action"` // "upload", "parse", "execute", "undo"

	// Import-specific fields
	ImportBatchID    string `json:"import_batch_id,omitempty"`
	FileName         string `json:"file_name,omitempty"`
	FileID           string `json:"file_id,omitempty"`
	FileType         string `json:"file_type,omitempty"`
	TransactionCount int    `json:"transaction_count,omitempty"`

	// Audit metadata
	Timestamp time.Time `json:"timestamp"`
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`

	// Result information
	Success      bool   `json:"success"`
	ErrorMessage string `json:"error_message,omitempty"`

	// Additional context (optional)
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// LogImportAudit logs a structured import audit event.
// This is the primary audit logging function for all import operations.
//
// Example usage:
//   logger.LogImportAudit(ctx, &logger.ImportAuditLog{
//       UserID:           userID,
//       WalletID:         walletID,
//       Action:           "execute",
//       ImportBatchID:    batchID,
//       TransactionCount: len(transactions),
//       IPAddress:        ipAddress,
//       UserAgent:        userAgent,
//       Success:          true,
//   })
func LogImportAudit(ctx context.Context, auditLog *ImportAuditLog) {
	if auditLog == nil {
		return
	}

	// Set timestamp if not already set
	if auditLog.Timestamp.IsZero() {
		auditLog.Timestamp = time.Now().UTC()
	}

	// Sanitize metadata to remove sensitive fields
	if auditLog.Metadata != nil {
		sanitized := make(map[string]interface{})
		for k, v := range auditLog.Metadata {
			if SensitiveFields[k] {
				sanitized[k] = "[REDACTED]"
			} else {
				sanitized[k] = v
			}
		}
		auditLog.Metadata = sanitized
	}

	// Log as structured JSON for easy parsing by log aggregators
	logData, err := json.Marshal(auditLog)
	if err != nil {
		log.Printf("[IMPORT_AUDIT_ERROR] Failed to marshal audit log: %v", err)
		return
	}

	// Write audit log with clear prefix for filtering
	log.Printf("[IMPORT_AUDIT] %s", string(logData))

	// TODO: Future enhancements:
	// 1. Send to dedicated audit log storage (separate from application logs)
	// 2. Integrate with SIEM (Security Information and Event Management) system
	// 3. Archive audit logs to long-term storage for compliance
	// 4. Alert on suspicious patterns (e.g., multiple failed imports)
}

// NewUploadAuditLog creates an audit log for file upload operations.
func NewUploadAuditLog(userID int32, fileID, fileName, fileType, ipAddress, userAgent string, success bool, errMsg string) *ImportAuditLog {
	return &ImportAuditLog{
		UserID:       userID,
		Action:       "upload",
		FileID:       fileID,
		FileName:     fileName,
		FileType:     fileType,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		Success:      success,
		ErrorMessage: errMsg,
	}
}

// NewParseAuditLog creates an audit log for file parsing operations.
func NewParseAuditLog(userID int32, fileID, fileType, ipAddress, userAgent string, transactionCount int, success bool, errMsg string) *ImportAuditLog {
	return &ImportAuditLog{
		UserID:           userID,
		Action:           "parse",
		FileID:           fileID,
		FileType:         fileType,
		TransactionCount: transactionCount,
		IPAddress:        ipAddress,
		UserAgent:        userAgent,
		Success:          success,
		ErrorMessage:     errMsg,
	}
}

// NewExecuteAuditLog creates an audit log for import execution operations.
func NewExecuteAuditLog(userID, walletID int32, importBatchID string, transactionCount int, ipAddress, userAgent string, success bool, errMsg string) *ImportAuditLog {
	return &ImportAuditLog{
		UserID:           userID,
		WalletID:         walletID,
		Action:           "execute",
		ImportBatchID:    importBatchID,
		TransactionCount: transactionCount,
		IPAddress:        ipAddress,
		UserAgent:        userAgent,
		Success:          success,
		ErrorMessage:     errMsg,
	}
}

// NewUndoAuditLog creates an audit log for undo import operations.
func NewUndoAuditLog(userID, walletID int32, importBatchID string, transactionCount int, ipAddress, userAgent string, success bool, errMsg string) *ImportAuditLog {
	return &ImportAuditLog{
		UserID:           userID,
		WalletID:         walletID,
		Action:           "undo",
		ImportBatchID:    importBatchID,
		TransactionCount: transactionCount,
		IPAddress:        ipAddress,
		UserAgent:        userAgent,
		Success:          success,
		ErrorMessage:     errMsg,
	}
}
