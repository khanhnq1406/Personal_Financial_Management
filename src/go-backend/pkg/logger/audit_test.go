package logger

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestImportAuditLog_Structure(t *testing.T) {
	// Test that audit log can be marshaled to JSON correctly
	auditLog := &ImportAuditLog{
		UserID:           123,
		WalletID:         456,
		Action:           "execute",
		ImportBatchID:    "batch-123",
		FileName:         "statement.csv",
		FileID:           "file-abc",
		FileType:         "csv",
		TransactionCount: 10,
		Timestamp:        time.Date(2026, 2, 12, 10, 0, 0, 0, time.UTC),
		IPAddress:        "192.168.1.100",
		UserAgent:        "Mozilla/5.0",
		Success:          true,
	}

	// Marshal to JSON
	data, err := json.Marshal(auditLog)
	assert.NoError(t, err)

	// Verify JSON structure
	var result map[string]interface{}
	err = json.Unmarshal(data, &result)
	assert.NoError(t, err)
	assert.Equal(t, float64(123), result["user_id"])
	assert.Equal(t, float64(456), result["wallet_id"])
	assert.Equal(t, "execute", result["action"])
	assert.Equal(t, "batch-123", result["import_batch_id"])
	assert.Equal(t, "statement.csv", result["file_name"])
	assert.Equal(t, "192.168.1.100", result["ip_address"])
	assert.Equal(t, "Mozilla/5.0", result["user_agent"])
	assert.Equal(t, true, result["success"])
}

func TestLogImportAudit_SetsTimestamp(t *testing.T) {
	// Test that timestamp is set automatically if not provided
	auditLog := &ImportAuditLog{
		UserID:    123,
		Action:    "upload",
		IPAddress: "192.168.1.100",
		UserAgent: "Mozilla/5.0",
		Success:   true,
	}

	// Timestamp should be zero before logging
	assert.True(t, auditLog.Timestamp.IsZero())

	// Log audit (this should set timestamp)
	LogImportAudit(context.Background(), auditLog)

	// Timestamp should now be set
	assert.False(t, auditLog.Timestamp.IsZero())
	assert.WithinDuration(t, time.Now().UTC(), auditLog.Timestamp, 5*time.Second)
}

func TestLogImportAudit_SanitizesMetadata(t *testing.T) {
	// Test that sensitive fields in metadata are redacted
	auditLog := &ImportAuditLog{
		UserID:    123,
		Action:    "execute",
		IPAddress: "192.168.1.100",
		UserAgent: "Mozilla/5.0",
		Success:   true,
		Metadata: map[string]interface{}{
			"transaction_count": 10,
			"amount":            50000,       // Sensitive
			"description":       "Test desc", // Sensitive
			"file_type":         "csv",       // Not sensitive
		},
	}

	// Log audit (this should sanitize metadata)
	LogImportAudit(context.Background(), auditLog)

	// Verify sensitive fields are redacted
	assert.Equal(t, "[REDACTED]", auditLog.Metadata["amount"])
	assert.Equal(t, "[REDACTED]", auditLog.Metadata["description"])

	// Verify non-sensitive fields remain
	assert.Equal(t, 10, auditLog.Metadata["transaction_count"])
	assert.Equal(t, "csv", auditLog.Metadata["file_type"])
}

func TestLogImportAudit_HandlesNil(t *testing.T) {
	// Test that nil audit log doesn't panic
	assert.NotPanics(t, func() {
		LogImportAudit(context.Background(), nil)
	})
}

func TestNewUploadAuditLog(t *testing.T) {
	auditLog := NewUploadAuditLog(
		123,
		"file-abc",
		"statement.csv",
		"csv",
		"192.168.1.100",
		"Mozilla/5.0",
		true,
		"",
	)

	assert.Equal(t, int32(123), auditLog.UserID)
	assert.Equal(t, "upload", auditLog.Action)
	assert.Equal(t, "file-abc", auditLog.FileID)
	assert.Equal(t, "statement.csv", auditLog.FileName)
	assert.Equal(t, "csv", auditLog.FileType)
	assert.Equal(t, "192.168.1.100", auditLog.IPAddress)
	assert.Equal(t, "Mozilla/5.0", auditLog.UserAgent)
	assert.True(t, auditLog.Success)
	assert.Empty(t, auditLog.ErrorMessage)
}

func TestNewParseAuditLog(t *testing.T) {
	auditLog := NewParseAuditLog(
		123,
		"file-abc",
		"pdf",
		"192.168.1.100",
		"Mozilla/5.0",
		25,
		true,
		"",
	)

	assert.Equal(t, int32(123), auditLog.UserID)
	assert.Equal(t, "parse", auditLog.Action)
	assert.Equal(t, "file-abc", auditLog.FileID)
	assert.Equal(t, "pdf", auditLog.FileType)
	assert.Equal(t, 25, auditLog.TransactionCount)
	assert.Equal(t, "192.168.1.100", auditLog.IPAddress)
	assert.Equal(t, "Mozilla/5.0", auditLog.UserAgent)
	assert.True(t, auditLog.Success)
}

func TestNewExecuteAuditLog(t *testing.T) {
	auditLog := NewExecuteAuditLog(
		123,
		456,
		"batch-789",
		50,
		"192.168.1.100",
		"Mozilla/5.0",
		true,
		"",
	)

	assert.Equal(t, int32(123), auditLog.UserID)
	assert.Equal(t, int32(456), auditLog.WalletID)
	assert.Equal(t, "execute", auditLog.Action)
	assert.Equal(t, "batch-789", auditLog.ImportBatchID)
	assert.Equal(t, 50, auditLog.TransactionCount)
	assert.Equal(t, "192.168.1.100", auditLog.IPAddress)
	assert.Equal(t, "Mozilla/5.0", auditLog.UserAgent)
	assert.True(t, auditLog.Success)
}

func TestNewUndoAuditLog(t *testing.T) {
	auditLog := NewUndoAuditLog(
		123,
		456,
		"batch-789",
		50,
		"192.168.1.100",
		"Mozilla/5.0",
		false,
		"undo failed: expired",
	)

	assert.Equal(t, int32(123), auditLog.UserID)
	assert.Equal(t, int32(456), auditLog.WalletID)
	assert.Equal(t, "undo", auditLog.Action)
	assert.Equal(t, "batch-789", auditLog.ImportBatchID)
	assert.Equal(t, 50, auditLog.TransactionCount)
	assert.Equal(t, "192.168.1.100", auditLog.IPAddress)
	assert.Equal(t, "Mozilla/5.0", auditLog.UserAgent)
	assert.False(t, auditLog.Success)
	assert.Equal(t, "undo failed: expired", auditLog.ErrorMessage)
}

func TestAuditLog_ActionTypes(t *testing.T) {
	// Test all supported action types
	actions := []string{"upload", "parse", "execute", "undo"}

	for _, action := range actions {
		t.Run(action, func(t *testing.T) {
			auditLog := &ImportAuditLog{
				UserID:    123,
				Action:    action,
				IPAddress: "192.168.1.100",
				UserAgent: "Mozilla/5.0",
				Success:   true,
			}

			data, err := json.Marshal(auditLog)
			assert.NoError(t, err)

			var result map[string]interface{}
			err = json.Unmarshal(data, &result)
			assert.NoError(t, err)
			assert.Equal(t, action, result["action"])
		})
	}
}

func TestAuditLog_ErrorScenarios(t *testing.T) {
	testCases := []struct {
		name         string
		auditLog     *ImportAuditLog
		expectError  bool
		errorMessage string
	}{
		{
			name: "failed upload - file too large",
			auditLog: NewUploadAuditLog(
				123,
				"",
				"large-file.csv",
				"csv",
				"192.168.1.100",
				"Mozilla/5.0",
				false,
				"file size exceeds limit",
			),
			expectError:  true,
			errorMessage: "file size exceeds limit",
		},
		{
			name: "failed parse - invalid format",
			auditLog: NewParseAuditLog(
				123,
				"file-abc",
				"csv",
				"192.168.1.100",
				"Mozilla/5.0",
				0,
				false,
				"invalid CSV format",
			),
			expectError:  true,
			errorMessage: "invalid CSV format",
		},
		{
			name: "failed execute - duplicate transaction",
			auditLog: NewExecuteAuditLog(
				123,
				456,
				"",
				10,
				"192.168.1.100",
				"Mozilla/5.0",
				false,
				"duplicate transaction detected",
			),
			expectError:  true,
			errorMessage: "duplicate transaction detected",
		},
		{
			name: "failed undo - undo period expired",
			auditLog: NewUndoAuditLog(
				123,
				456,
				"batch-789",
				50,
				"192.168.1.100",
				"Mozilla/5.0",
				false,
				"undo period expired",
			),
			expectError:  true,
			errorMessage: "undo period expired",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			assert.False(t, tc.auditLog.Success)
			assert.Equal(t, tc.errorMessage, tc.auditLog.ErrorMessage)

			// Verify it can be marshaled to JSON
			data, err := json.Marshal(tc.auditLog)
			assert.NoError(t, err)

			var result map[string]interface{}
			err = json.Unmarshal(data, &result)
			assert.NoError(t, err)
			assert.Equal(t, false, result["success"])
			assert.Equal(t, tc.errorMessage, result["error_message"])
		})
	}
}

func TestAuditLog_ComplianceFields(t *testing.T) {
	// Test that all required compliance fields are present
	auditLog := NewExecuteAuditLog(
		123,
		456,
		"batch-789",
		50,
		"192.168.1.100",
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
		true,
		"",
	)

	// Verify all required fields are set
	assert.NotZero(t, auditLog.UserID, "UserID is required")
	assert.NotZero(t, auditLog.WalletID, "WalletID is required")
	assert.NotEmpty(t, auditLog.Action, "Action is required")
	assert.NotEmpty(t, auditLog.ImportBatchID, "ImportBatchID is required for execute action")
	assert.NotZero(t, auditLog.TransactionCount, "TransactionCount is required")
	assert.NotEmpty(t, auditLog.IPAddress, "IPAddress is required for compliance")
	assert.NotEmpty(t, auditLog.UserAgent, "UserAgent is required for compliance")

	// Marshal to JSON
	data, err := json.Marshal(auditLog)
	assert.NoError(t, err)

	// Verify all compliance fields are in JSON output
	var result map[string]interface{}
	err = json.Unmarshal(data, &result)
	assert.NoError(t, err)

	requiredFields := []string{
		"user_id", "wallet_id", "action", "import_batch_id",
		"transaction_count", "ip_address", "user_agent", "success",
	}

	for _, field := range requiredFields {
		assert.Contains(t, result, field, "Required field %s must be present", field)
	}
}
