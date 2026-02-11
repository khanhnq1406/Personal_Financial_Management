package parser

import (
	"strings"
)

// TypeDetector detects transaction type (income/expense) from description and amount
type TypeDetector struct {
	// Configurable keyword lists
	incomeKeywords  []string
	expenseKeywords []string
}

// NewTypeDetector creates a new type detector with default keywords
func NewTypeDetector() *TypeDetector {
	return &TypeDetector{
		incomeKeywords:  getDefaultIncomeKeywords(),
		expenseKeywords: getDefaultExpenseKeywords(),
	}
}

// DetectType determines if a transaction is income or expense
func (d *TypeDetector) DetectType(description string, amount int64) string {
	// Clean and normalize description
	descLower := strings.ToLower(description)

	// Check explicit type keywords first
	if d.matchesIncomeKeywords(descLower) {
		return "income"
	}

	if d.matchesExpenseKeywords(descLower) {
		return "expense"
	}

	// Fall back to amount sign
	if amount >= 0 {
		return "income"
	}
	return "expense"
}

// matchesIncomeKeywords checks if description contains income keywords
func (d *TypeDetector) matchesIncomeKeywords(descLower string) bool {
	for _, keyword := range d.incomeKeywords {
		if strings.Contains(descLower, keyword) {
			return true
		}
	}
	return false
}

// matchesExpenseKeywords checks if description contains expense keywords
func (d *TypeDetector) matchesExpenseKeywords(descLower string) bool {
	for _, keyword := range d.expenseKeywords {
		if strings.Contains(descLower, keyword) {
			return true
		}
	}
	return false
}

// getDefaultIncomeKeywords returns default income keywords (English + Vietnamese)
func getDefaultIncomeKeywords() []string {
	return []string{
		// English keywords
		"salary",
		"payroll",
		"wage",
		"income",
		"dividend",
		"interest",
		"refund",
		"reimbursement",
		"cashback",
		"cash back",
		"rebate",
		"bonus",
		"commission",
		"gift",
		"deposit",
		"credit",
		"receive",
		"received",
		"transfer in",
		"incoming",
		"inflow",

		// Vietnamese keywords
		"lương",
		"luong",
		"tiền lương",
		"tien luong",
		"thu nhập",
		"thu nhap",
		"hoàn tiền",
		"hoan tien",
		"hoàn trả",
		"hoan tra",
		"tiền thưởng",
		"tien thuong",
		"thưởng",
		"thuong",
		"cổ tức",
		"co tuc",
		"lãi",
		"lai",
		"lãi suất",
		"lai suat",
		"nhận tiền",
		"nhan tien",
		"chuyển đến",
		"chuyen den",
		"tiền về",
		"tien ve",
	}
}

// getDefaultExpenseKeywords returns default expense keywords (English + Vietnamese)
func getDefaultExpenseKeywords() []string {
	return []string{
		// English keywords
		"purchase",
		"payment",
		"withdrawal",
		"debit",
		"spend",
		"spending",
		"buy",
		"bought",
		"paid",
		"fee",
		"charge",
		"bill",
		"subscription",
		"transfer out",
		"outgoing",
		"outflow",
		"pos",
		"atm",

		// Vietnamese keywords
		"mua hàng",
		"mua hang",
		"mua",
		"thanh toán",
		"thanh toan",
		"chi tiêu",
		"chi tieu",
		"chi",
		"rút tiền",
		"rut tien",
		"rút",
		"rut",
		"phí",
		"phi",
		"lệ phí",
		"le phi",
		"hóa đơn",
		"hoa don",
		"chuyển đi",
		"chuyen di",
		"tiền ra",
		"tien ra",
		"giao dịch",
		"giao dich",
	}
}

// DetectTypeFromDescription is a convenience function using default keywords
func DetectTypeFromDescription(description string, amount int64) string {
	detector := NewTypeDetector()
	return detector.DetectType(description, amount)
}
