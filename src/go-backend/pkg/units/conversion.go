package units

import (
	"wealthjourney/protobuf/v1"
)

// DecimalPrecision defines the decimal places for different asset types
type DecimalPrecision int64

const (
	Precision4Decimals DecimalPrecision = 10000   // Stocks, ETFs, Mutual Funds
	Precision8Decimals DecimalPrecision = 100000000 // Cryptocurrency
)

// GetPrecisionForInvestmentType returns the decimal multiplier for an investment type
func GetPrecisionForInvestmentType(investmentType v1.InvestmentType) DecimalPrecision {
	if investmentType == v1.InvestmentType_INVESTMENT_TYPE_CRYPTOCURRENCY {
		return Precision8Decimals
	}
	return Precision4Decimals
}

// QuantityToStorage converts user input quantity (float) to storage format (int64 in smallest units)
// Example: 1.5 BTC → 150,000,000 satoshis
func QuantityToStorage(quantity float64, investmentType v1.InvestmentType) int64 {
	precision := GetPrecisionForInvestmentType(investmentType)
	return int64(quantity * float64(precision))
}

// QuantityFromStorage converts storage quantity to display format (float)
// Example: 150,000,000 satoshis → 1.5 BTC
func QuantityFromStorage(quantity int64, investmentType v1.InvestmentType) float64 {
	precision := GetPrecisionForInvestmentType(investmentType)
	return float64(quantity) / float64(precision)
}

// CentsToDollars converts cents from storage to dollars for display
func CentsToDollars(cents int64) float64 {
	return float64(cents) / 100
}

// DollarsToCents converts dollars to cents for storage
func DollarsToCents(dollars float64) int64 {
	return int64(dollars * 100)
}

// CalculateAverageCost calculates the average cost per unit in cents
// Formula: (totalCostCents * decimalMultiplier) / quantity
func CalculateAverageCost(totalCostCents int64, quantity int64, investmentType v1.InvestmentType) int64 {
	precision := GetPrecisionForInvestmentType(investmentType)
	return totalCostCents * int64(precision) / quantity
}

// CalculateTransactionCost calculates the total cost of a transaction in cents
// Formula: (quantity / decimalMultiplier) * priceCents
// Uses float64 to avoid integer division truncation with fractional quantities
func CalculateTransactionCost(quantity int64, priceCents int64, investmentType v1.InvestmentType) int64 {
	precision := GetPrecisionForInvestmentType(investmentType)
	quantityWholeUnits := float64(quantity) / float64(precision)
	return int64(quantityWholeUnits * float64(priceCents))
}

// CalculateCurrentValue calculates the current value in cents
// Formula: (quantity / decimalMultiplier) * priceCents
// Uses float64 to avoid integer division truncation with fractional quantities
func CalculateCurrentValue(quantity int64, priceCents int64, investmentType v1.InvestmentType) int64 {
	precision := GetPrecisionForInvestmentType(investmentType)
	quantityWholeUnits := float64(quantity) / float64(precision)
	return int64(quantityWholeUnits * float64(priceCents))
}

// CalculateRealizedPNL calculates realized profit/loss for a sell transaction
// lotCostBasis and lotSellValue should be in the same units (cents)
func CalculateRealizedPNL(lotCostBasis int64, lotSellValue int64) int64 {
	return lotSellValue - lotCostBasis
}

// CalculateUnrealizedPNL calculates unrealized profit/loss
// currentValue and totalCost should both be in cents
func CalculateUnrealizedPNL(currentValue int64, totalCost int64) int64 {
	return currentValue - totalCost
}

// CalculateUnrealizedPNLPercent calculates unrealized PNL as a percentage
func CalculateUnrealizedPNLPercent(unrealizedPNL int64, totalCost int64) float64 {
	if totalCost == 0 {
		return 0
	}
	return (float64(unrealizedPNL) / float64(totalCost)) * 100
}
