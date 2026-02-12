package validator

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestValidateAmount(t *testing.T) {
	tests := []struct {
		name           string
		amount         int64
		currency       string
		wantErrorCount int
		wantError      bool
		wantWarning    bool
		errorMessage   string
	}{
		{
			name:           "valid amount - positive",
			amount:         100000000, // 10,000 VND in smallest unit (×10000)
			currency:       "VND",
			wantErrorCount: 0,
		},
		{
			name:           "valid amount - negative (expense)",
			amount:         -100000000,
			currency:       "VND",
			wantErrorCount: 0,
		},
		{
			name:           "zero amount",
			amount:         0,
			currency:       "VND",
			wantErrorCount: 1,
			wantError:      true,
			errorMessage:   "Amount cannot be zero",
		},
		{
			name:           "amount > 1 billion VND - warning",
			amount:         10000100000000, // 1,000,010,000 VND in smallest unit
			currency:       "VND",
			wantErrorCount: 1,
			wantWarning:    true,
			errorMessage:   "Amount is very large (>1 billion VND). Please verify.",
		},
		{
			name:           "amount exactly 1 billion VND - no warning",
			amount:         10000000000000, // 1,000,000,000 VND exactly
			currency:       "VND",
			wantErrorCount: 0,
		},
		{
			name:           "large negative amount - warning",
			amount:         -10000100000000,
			currency:       "VND",
			wantErrorCount: 1,
			wantWarning:    true,
		},
		{
			name:           "large USD amount - no warning (different currency)",
			amount:         10000100000000,
			currency:       "USD",
			wantErrorCount: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errors := ValidateAmount(tt.amount, tt.currency)

			assert.Equal(t, tt.wantErrorCount, len(errors), "unexpected error count")

			if tt.wantErrorCount > 0 {
				assert.Equal(t, "amount", errors[0].Field)
				assert.Contains(t, errors[0].Message, tt.errorMessage)

				if tt.wantError {
					assert.Equal(t, "error", errors[0].Severity)
				}
				if tt.wantWarning {
					assert.Equal(t, "warning", errors[0].Severity)
				}
			}
		})
	}
}

func TestValidateTransactionCurrency(t *testing.T) {
	tests := []struct {
		name         string
		currency     string
		wantError    bool
		errorMessage string
	}{
		{
			name:      "valid currency - VND",
			currency:  "VND",
			wantError: false,
		},
		{
			name:      "valid currency - USD",
			currency:  "USD",
			wantError: false,
		},
		{
			name:      "valid currency - EUR",
			currency:  "EUR",
			wantError: false,
		},
		{
			name:      "valid currency - JPY",
			currency:  "JPY",
			wantError: false,
		},
		{
			name:         "invalid currency - lowercase",
			currency:     "vnd",
			wantError:    true,
			errorMessage: "Invalid currency code",
		},
		{
			name:         "invalid currency - too short",
			currency:     "VN",
			wantError:    true,
			errorMessage: "Invalid currency code",
		},
		{
			name:         "invalid currency - not ISO 4217",
			currency:     "XXX",
			wantError:    true,
			errorMessage: "Invalid currency code",
		},
		{
			name:         "empty currency",
			currency:     "",
			wantError:    true,
			errorMessage: "Invalid currency code",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errors := ValidateTransactionCurrency(tt.currency)

			if tt.wantError {
				assert.NotEmpty(t, errors, "expected error but got none")
				assert.Equal(t, "currency", errors[0].Field)
				assert.Contains(t, errors[0].Message, tt.errorMessage)
				assert.Equal(t, "error", errors[0].Severity)
			} else {
				assert.Empty(t, errors, "expected no errors but got some")
			}
		})
	}
}

func TestValidateTransactionDescription(t *testing.T) {
	tests := []struct {
		name         string
		description  string
		wantError    bool
		wantWarning  bool
		errorMessage string
	}{
		{
			name:        "valid description",
			description: "Payment for groceries",
			wantError:   false,
		},
		{
			name:        "valid description - minimum length",
			description: "OK",
			wantError:   false,
		},
		{
			name:        "valid description - maximum length",
			description: string(make([]byte, 500)),
			wantError:   false,
		},
		{
			name:         "description too short",
			description:  "A",
			wantError:    true,
			errorMessage: "Description must be at least 2 characters",
		},
		{
			name:         "empty description",
			description:  "",
			wantError:    true,
			errorMessage: "Description must be at least 2 characters",
		},
		{
			name:         "description too long",
			description:  string(make([]byte, 501)),
			wantError:    true,
			errorMessage: "Description must be at most 500 characters",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errors := ValidateTransactionDescription(tt.description)

			if tt.wantError {
				assert.NotEmpty(t, errors, "expected error but got none")
				assert.Equal(t, "description", errors[0].Field)
				assert.Contains(t, errors[0].Message, tt.errorMessage)
				assert.Equal(t, "error", errors[0].Severity)
			} else {
				assert.Empty(t, errors, "expected no errors but got some")
			}
		})
	}
}

func TestValidateTransactionDate(t *testing.T) {
	now := time.Now()
	// Subtract 1 hour to ensure we're safely within the 1-year threshold
	oneYearAgo := now.AddDate(-1, 0, 0).Add(1 * time.Hour)
	twoYearsAgo := now.AddDate(-2, 0, 0)
	oneYearAndOneDayAgo := now.AddDate(-1, 0, -1)

	tests := []struct {
		name         string
		date         time.Time
		wantError    bool
		wantWarning  bool
		errorMessage string
	}{
		{
			name:        "valid date - today",
			date:        now,
			wantError:   false,
			wantWarning: false,
		},
		{
			name:        "valid date - yesterday",
			date:        now.AddDate(0, 0, -1),
			wantError:   false,
			wantWarning: false,
		},
		{
			name:        "valid date - 6 months ago",
			date:        now.AddDate(0, -6, 0),
			wantError:   false,
			wantWarning: false,
		},
		{
			name:        "valid date - exactly 1 year ago",
			date:        oneYearAgo,
			wantError:   false,
			wantWarning: false,
		},
		{
			name:         "old date - 1 year and 1 day ago - warning",
			date:         oneYearAndOneDayAgo,
			wantError:    false,
			wantWarning:  true,
			errorMessage: "Date is older than 1 year. Please verify.",
		},
		{
			name:         "old date - 2 years ago - warning",
			date:         twoYearsAgo,
			wantError:    false,
			wantWarning:  true,
			errorMessage: "Date is older than 1 year. Please verify.",
		},
		{
			name:         "future date - error",
			date:         now.AddDate(0, 0, 1),
			wantError:    true,
			errorMessage: "Date cannot be in the future",
		},
		{
			name:         "far future date - error",
			date:         now.AddDate(1, 0, 0),
			wantError:    true,
			errorMessage: "Date cannot be in the future",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errors := ValidateTransactionDate(tt.date)

			if tt.wantError || tt.wantWarning {
				assert.NotEmpty(t, errors, "expected error/warning but got none")
				assert.Equal(t, "date", errors[0].Field)
				assert.Contains(t, errors[0].Message, tt.errorMessage)

				if tt.wantError {
					assert.Equal(t, "error", errors[0].Severity)
				}
				if tt.wantWarning {
					assert.Equal(t, "warning", errors[0].Severity)
				}
			} else {
				assert.Empty(t, errors, "expected no errors but got some")
			}
		})
	}
}

func TestValidateTransaction_WithConfig(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name        string
		amount      int64
		currency    string
		description string
		date        time.Time
		config      *TransactionValidationConfig
		wantCount   int
	}{
		{
			name:        "valid transaction - all fields",
			amount:      100000000,
			currency:    "VND",
			description: "Valid transaction",
			date:        now.AddDate(0, -1, 0),
			config:      DefaultValidationConfig(),
			wantCount:   0,
		},
		{
			name:        "zero amount with ignore config",
			amount:      0,
			currency:    "VND",
			description: "Zero amount",
			date:        now,
			config: &TransactionValidationConfig{
				ZeroAmountPolicy:     "ignore",
				LargeAmountThreshold: 10000000000000,
				OldDateThresholdDays: 365,
			},
			wantCount: 0,
		},
		{
			name:        "zero amount with warning config",
			amount:      0,
			currency:    "VND",
			description: "Zero amount",
			date:        now,
			config: &TransactionValidationConfig{
				ZeroAmountPolicy:     "warning",
				LargeAmountThreshold: 10000000000000,
				OldDateThresholdDays: 365,
			},
			wantCount: 1, // Should have warning
		},
		{
			name:        "large amount with custom threshold",
			amount:      20000000000000, // 2 billion VND
			currency:    "VND",
			description: "Large amount",
			date:        now,
			config: &TransactionValidationConfig{
				ZeroAmountPolicy:     "error",
				LargeAmountThreshold: 30000000000000, // 3 billion
				OldDateThresholdDays: 365,
			},
			wantCount: 0, // Below custom threshold
		},
		{
			name:        "old date with custom threshold",
			amount:      100000000,
			currency:    "VND",
			description: "Old transaction",
			date:        now.AddDate(-2, 0, 0), // 2 years ago
			config: &TransactionValidationConfig{
				ZeroAmountPolicy:     "error",
				LargeAmountThreshold: 10000000000000,
				OldDateThresholdDays: 1095, // 3 years
			},
			wantCount: 0, // Within custom threshold
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errors := ValidateTransactionWithConfig(
				tt.amount,
				tt.currency,
				tt.description,
				tt.date,
				tt.config,
			)

			assert.Equal(t, tt.wantCount, len(errors), "unexpected error count")
		})
	}
}
