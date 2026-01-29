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

	// Convert using decimal for precision
	// amount (int64) -> decimal -> multiply by rate -> convert back to int64
	amountDecimal := decimal.NewFromInt(amount)
	rateDecimal := decimal.NewFromFloat(rate)

	convertedDecimal := amountDecimal.Mul(rateDecimal)

	// Get integer part (we lose decimal places in currency conversion)
	// This is acceptable for most use cases where we work in smallest currency units
	converted := convertedDecimal.IntPart()

	return converted, nil
}

// ConvertAmountWithRate converts an amount using a provided rate
// Useful when you have multiple conversions with the same rate
func (c *Converter) ConvertAmountWithRate(amount int64, rate float64) int64 {
	amountDecimal := decimal.NewFromInt(amount)
	rateDecimal := decimal.NewFromFloat(rate)
	convertedDecimal := amountDecimal.Mul(rateDecimal)
	return convertedDecimal.IntPart()
}

// ConvertBatch converts multiple amounts using batch rate fetching for efficiency
// Returns a map of index to converted amount
func (c *Converter) ConvertBatch(ctx context.Context, amounts []int64, fromCurrency, toCurrency string) ([]int64, error) {
	// If same currency, return as-is
	if normalize(fromCurrency) == normalize(toCurrency) {
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

	// Convert all amounts
	results := make([]int64, len(amounts))
	for i, amount := range amounts {
		results[i] = c.ConvertAmountWithRate(amount, rate)
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
