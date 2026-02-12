package parser

import (
	"testing"
)

func TestTypeDetector_DetectType(t *testing.T) {
	tests := []struct {
		name        string
		description string
		amount      int64
		want        string
	}{
		// Income detection - English keywords
		{
			name:        "Salary",
			description: "Monthly salary payment",
			amount:      50000000, // positive
			want:        "income",
		},
		{
			name:        "Payroll",
			description: "Payroll deposit",
			amount:      30000000,
			want:        "income",
		},
		{
			name:        "Refund",
			description: "Refund from Amazon",
			amount:      500000,
			want:        "income",
		},
		{
			name:        "Cashback",
			description: "Cashback reward",
			amount:      100000,
			want:        "income",
		},
		{
			name:        "Dividend",
			description: "Dividend payment",
			amount:      1000000,
			want:        "income",
		},
		{
			name:        "Interest",
			description: "Interest credit",
			amount:      50000,
			want:        "income",
		},
		{
			name:        "Gift",
			description: "Gift from friend",
			amount:      1000000,
			want:        "income",
		},
		{
			name:        "Transfer in",
			description: "Transfer in from savings",
			amount:      5000000,
			want:        "income",
		},

		// Income detection - Vietnamese keywords
		{
			name:        "Vietnamese salary",
			description: "Tiền lương tháng 1",
			amount:      20000000,
			want:        "income",
		},
		{
			name:        "Vietnamese refund",
			description: "Hoàn tiền từ Shopee",
			amount:      500000,
			want:        "income",
		},
		{
			name:        "Vietnamese bonus",
			description: "Tiền thưởng cuối năm",
			amount:      10000000,
			want:        "income",
		},
		{
			name:        "Vietnamese receive",
			description: "Nhận tiền từ khách hàng",
			amount:      5000000,
			want:        "income",
		},
		{
			name:        "Vietnamese interest",
			description: "Lãi tiết kiệm",
			amount:      100000,
			want:        "income",
		},

		// Expense detection - English keywords
		{
			name:        "Purchase",
			description: "Purchase at Starbucks",
			amount:      -100000, // negative
			want:        "expense",
		},
		{
			name:        "Payment",
			description: "Payment to Amazon",
			amount:      -500000,
			want:        "expense",
		},
		{
			name:        "Withdrawal",
			description: "ATM withdrawal",
			amount:      -2000000,
			want:        "expense",
		},
		{
			name:        "Fee",
			description: "Monthly fee",
			amount:      -50000,
			want:        "expense",
		},
		{
			name:        "Bill",
			description: "Electricity bill",
			amount:      -300000,
			want:        "expense",
		},
		{
			name:        "Subscription",
			description: "Netflix subscription",
			amount:      -200000,
			want:        "expense",
		},
		{
			name:        "POS transaction",
			description: "POS purchase Circle K",
			amount:      -50000,
			want:        "expense",
		},

		// Expense detection - Vietnamese keywords
		{
			name:        "Vietnamese purchase",
			description: "Mua hàng tại Vinmart",
			amount:      -500000,
			want:        "expense",
		},
		{
			name:        "Vietnamese payment",
			description: "Thanh toán tiền điện",
			amount:      -300000,
			want:        "expense",
		},
		{
			name:        "Vietnamese withdrawal",
			description: "Rút tiền ATM",
			amount:      -1000000,
			want:        "expense",
		},
		{
			name:        "Vietnamese fee",
			description: "Phí chuyển khoản",
			amount:      -10000,
			want:        "expense",
		},
		{
			name:        "Vietnamese spending",
			description: "Chi tiêu ăn uống",
			amount:      -200000,
			want:        "expense",
		},

		// Fallback to amount sign
		{
			name:        "Positive amount no keywords",
			description: "Some transaction",
			amount:      1000000,
			want:        "income",
		},
		{
			name:        "Negative amount no keywords",
			description: "Some transaction",
			amount:      -1000000,
			want:        "expense",
		},
		{
			name:        "Zero amount",
			description: "Zero transaction",
			amount:      0,
			want:        "income", // Zero is >= 0, so income
		},

		// Conflicting cases - keyword wins over amount
		{
			name:        "Salary with negative amount (refund/correction)",
			description: "Salary correction",
			amount:      -1000000, // negative but contains salary keyword
			want:        "income",
		},
		{
			name:        "Purchase with positive amount (refund)",
			description: "Purchase refund",
			amount:      500000, // positive but contains purchase AND refund
			want:        "income", // refund should win
		},

		// Case insensitivity
		{
			name:        "Uppercase salary",
			description: "SALARY PAYMENT",
			amount:      5000000,
			want:        "income",
		},
		{
			name:        "Mixed case purchase",
			description: "Purchase At Store",
			amount:      -100000,
			want:        "expense",
		},

		// Empty description
		{
			name:        "Empty description positive",
			description: "",
			amount:      1000000,
			want:        "income",
		},
		{
			name:        "Empty description negative",
			description: "",
			amount:      -1000000,
			want:        "expense",
		},
	}

	detector := NewTypeDetector()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := detector.DetectType(tt.description, tt.amount)
			if got != tt.want {
				t.Errorf("DetectType(%q, %d) = %q, want %q", tt.description, tt.amount, got, tt.want)
			}
		})
	}
}

func TestTypeDetector_IncomeKeywords(t *testing.T) {
	keywords := []string{
		"salary", "payroll", "wage", "income", "dividend", "interest",
		"refund", "cashback", "bonus", "commission", "gift",
		"lương", "thu nhập", "hoàn tiền", "thưởng", "lãi",
	}

	detector := NewTypeDetector()

	for _, keyword := range keywords {
		t.Run(keyword, func(t *testing.T) {
			description := "Payment with " + keyword
			result := detector.DetectType(description, -100000)
			if result != "income" {
				t.Errorf("DetectType with keyword %q should be income, got %q", keyword, result)
			}
		})
	}
}

func TestTypeDetector_ExpenseKeywords(t *testing.T) {
	keywords := []string{
		"purchase", "payment", "withdrawal", "debit", "spend",
		"buy", "fee", "charge", "bill", "subscription",
		"mua hàng", "thanh toán", "chi tiêu", "rút tiền", "phí",
	}

	detector := NewTypeDetector()

	for _, keyword := range keywords {
		t.Run(keyword, func(t *testing.T) {
			description := "Transaction " + keyword
			result := detector.DetectType(description, 100000) // positive amount
			if result != "expense" {
				t.Errorf("DetectType with keyword %q should be expense, got %q", keyword, result)
			}
		})
	}
}

func TestTypeDetector_PriorityOrder(t *testing.T) {
	tests := []struct {
		name        string
		description string
		amount      int64
		want        string
		reason      string
	}{
		{
			name:        "Income keyword wins over negative amount",
			description: "Salary payment",
			amount:      -100000,
			want:        "income",
			reason:      "Income keywords should override amount sign",
		},
		{
			name:        "Expense keyword wins over positive amount",
			description: "Purchase at store",
			amount:      100000,
			want:        "expense",
			reason:      "Expense keywords should override amount sign",
		},
		{
			name:        "Both keywords - income wins (refund scenario)",
			description: "Purchase refund",
			amount:      100000,
			want:        "income",
			reason:      "Refund (income) should win in refund scenarios",
		},
	}

	detector := NewTypeDetector()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := detector.DetectType(tt.description, tt.amount)
			if got != tt.want {
				t.Errorf("DetectType() = %q, want %q. Reason: %s", got, tt.want, tt.reason)
			}
		})
	}
}

func TestDetectTypeFromDescription(t *testing.T) {
	// Test convenience function
	result := DetectTypeFromDescription("Monthly salary", 5000000)
	if result != "income" {
		t.Errorf("DetectTypeFromDescription() = %q, want income", result)
	}

	result = DetectTypeFromDescription("Purchase at store", -100000)
	if result != "expense" {
		t.Errorf("DetectTypeFromDescription() = %q, want expense", result)
	}
}
