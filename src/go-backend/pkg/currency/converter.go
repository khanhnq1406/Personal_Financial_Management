package currency

import (
	"context"
	"fmt"

	"github.com/shopspring/decimal"
	"wealthjourney/pkg/fx"
)

// Converter handles currency conversion with precise decimal arithmetic
type Converter struct {
	rateProvider fx.Provider
}

// NewConverter creates a new currency converter
func NewConverter(rateProvider fx.Provider) *Converter {
	return &Converter{
		rateProvider: rateProvider,
	}
}

// ConvertAmount converts an amount from one currency to another
// Amount is in the smallest currency unit (e.g., cents for USD, dong for VND)
// Returns the converted amount also in the smallest currency unit
//
// The conversion accounts for different decimal places between currencies:
// - USD has 2 decimal places (100 cents = $1)
// - VND has 0 decimal places (1 dong = 1 dong)
//
// Example: Converting 42 cents USD to VND at rate 25850:
// 1. Convert 42 cents to dollars: 42 / 100 = 0.42
// 2. Apply FX rate: 0.42 * 25850 = 10857
// 3. Convert to VND smallest unit: 10857 * 1 = 10857 dong
func (c *Converter) ConvertAmount(ctx context.Context, amount int64, fromCurrency, toCurrency string) (int64, error) {
	// Normalize currency codes
	fromCurrency = normalize(fromCurrency)
	toCurrency = normalize(toCurrency)

	// Same currency - no conversion needed
	if fromCurrency == toCurrency {
		return amount, nil
	}

	// Get the FX rate
	rate, err := c.rateProvider.GetRate(ctx, fromCurrency, toCurrency)
	if err != nil {
		return 0, fmt.Errorf("failed to get FX rate: %w", err)
	}

	// Validate the rate
	if err := fx.ValidateRate(fromCurrency, toCurrency, rate); err != nil {
		return 0, fmt.Errorf("invalid FX rate: %w", err)
	}

	// Get decimal multipliers for both currencies
	fromMultiplier := fx.GetDecimalMultiplier(fromCurrency)
	toMultiplier := fx.GetDecimalMultiplier(toCurrency)

	// Convert using decimal for precision
	// 1. Convert from smallest unit to base unit (divide by fromMultiplier)
	// 2. Apply FX rate
	// 3. Convert to target smallest unit (multiply by toMultiplier)
	amountDecimal := decimal.NewFromInt(amount)
	fromMultiplierDecimal := decimal.NewFromInt(fromMultiplier)
	toMultiplierDecimal := decimal.NewFromInt(toMultiplier)
	rateDecimal := decimal.NewFromFloat(rate)

	// Formula: (amount / fromMultiplier) * rate * toMultiplier
	convertedDecimal := amountDecimal.
		Div(fromMultiplierDecimal).
		Mul(rateDecimal).
		Mul(toMultiplierDecimal)

	// Round to nearest integer (we're in smallest currency units)
	converted := convertedDecimal.Round(0).IntPart()

	return converted, nil
}

// ConvertAmountWithRate converts an amount using a provided rate and currency info
// Useful when you have multiple conversions with the same rate
// DEPRECATED: Use ConvertAmountWithRateAndCurrencies instead for proper decimal handling
func (c *Converter) ConvertAmountWithRate(amount int64, rate float64) int64 {
	amountDecimal := decimal.NewFromInt(amount)
	rateDecimal := decimal.NewFromFloat(rate)
	convertedDecimal := amountDecimal.Mul(rateDecimal)
	return convertedDecimal.IntPart()
}

// ConvertAmountWithRateAndCurrencies converts an amount using a provided rate
// while accounting for different decimal places between currencies
func (c *Converter) ConvertAmountWithRateAndCurrencies(amount int64, rate float64, fromCurrency, toCurrency string) int64 {
	// Get decimal multipliers for both currencies
	fromMultiplier := fx.GetDecimalMultiplier(fromCurrency)
	toMultiplier := fx.GetDecimalMultiplier(toCurrency)

	amountDecimal := decimal.NewFromInt(amount)
	fromMultiplierDecimal := decimal.NewFromInt(fromMultiplier)
	toMultiplierDecimal := decimal.NewFromInt(toMultiplier)
	rateDecimal := decimal.NewFromFloat(rate)

	// Formula: (amount / fromMultiplier) * rate * toMultiplier
	convertedDecimal := amountDecimal.
		Div(fromMultiplierDecimal).
		Mul(rateDecimal).
		Mul(toMultiplierDecimal)

	return convertedDecimal.Round(0).IntPart()
}

// ConvertBatch converts multiple amounts using batch rate fetching for efficiency
// Returns a map of index to converted amount
func (c *Converter) ConvertBatch(ctx context.Context, amounts []int64, fromCurrency, toCurrency string) ([]int64, error) {
	// Normalize currency codes
	fromCurrency = normalize(fromCurrency)
	toCurrency = normalize(toCurrency)

	// If same currency, return as-is
	if fromCurrency == toCurrency {
		return amounts, nil
	}

	// Get the rate once for all conversions
	rate, err := c.rateProvider.GetRate(ctx, fromCurrency, toCurrency)
	if err != nil {
		return nil, fmt.Errorf("failed to get FX rate: %w", err)
	}

	// Validate the rate
	if err := fx.ValidateRate(fromCurrency, toCurrency, rate); err != nil {
		return nil, fmt.Errorf("invalid FX rate: %w", err)
	}

	// Convert all amounts using the new method that accounts for decimal places
	results := make([]int64, len(amounts))
	for i, amount := range amounts {
		results[i] = c.ConvertAmountWithRateAndCurrencies(amount, rate, fromCurrency, toCurrency)
	}

	return results, nil
}

// Normalize normalizes a currency code
func normalize(currency string) string {
	if len(currency) == 3 {
		return currency
	}
	return currency
}
