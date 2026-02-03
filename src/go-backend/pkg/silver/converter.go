package silver

import (
	"context"
	"fmt"
	"math"

	"wealthjourney/pkg/fx"
	investmentv1 "wealthjourney/protobuf/v1"
)

// Converter handles BOTH unit and currency conversions for silver
type Converter struct {
	fxService fx.Service
}

func NewSilverConverter(fxService fx.Service) *Converter {
	return &Converter{fxService: fxService}
}

// ===== LAYER 1: UNIT CONVERSION =====

// ConvertQuantity converts quantity between units (no currency involved)
func ConvertQuantity(quantity float64, fromUnit, toUnit SilverUnit) float64 {
	// Convert everything to grams first, then to target
	var inGrams float64

	switch fromUnit {
	case UnitTael:
		inGrams = quantity * GramsPerTael
	case UnitKg:
		inGrams = quantity * GramsPerKg
	case UnitOunce:
		inGrams = quantity * GramsPerOunce
	case UnitGram:
		inGrams = quantity
	}

	switch toUnit {
	case UnitTael:
		return inGrams / GramsPerTael
	case UnitKg:
		return inGrams / GramsPerKg
	case UnitOunce:
		return inGrams / GramsPerOunce
	case UnitGram:
		return inGrams
	}

	return inGrams
}

// ConvertPricePerUnit converts price between units (no currency involved)
// Price is inversely proportional to quantity
func ConvertPricePerUnit(price float64, fromUnit, toUnit SilverUnit) float64 {
	var quantityRatio float64

	switch fromUnit {
	case UnitTael:
		quantityRatio = GramsPerTael
	case UnitKg:
		quantityRatio = GramsPerKg
	case UnitOunce:
		quantityRatio = GramsPerOunce
	case UnitGram:
		quantityRatio = 1
	}

	pricePerGram := price / quantityRatio

	switch toUnit {
	case UnitTael:
		return pricePerGram * GramsPerTael
	case UnitKg:
		return pricePerGram * GramsPerKg
	case UnitOunce:
		return pricePerGram * GramsPerOunce
	case UnitGram:
		return pricePerGram
	}

	return pricePerGram
}

// ===== STORAGE NORMALIZATION =====

// NormalizeQuantityForStorage converts user input to storage format
// Storage format: base_unit × 10000 (4 decimal precision)
func (c *Converter) NormalizeQuantityForStorage(
	quantity float64,
	inputUnit SilverUnit,
	investmentType investmentv1.InvestmentType,
) (int64, error) {
	storageUnit, _ := GetNativeStorageInfo(investmentType)

	// Convert input unit to storage unit
	inStorageUnits := ConvertQuantity(quantity, inputUnit, storageUnit)

	// Store with 4 decimal precision
	return int64(math.Round(inStorageUnits * 10000)), nil
}

// DenormalizeQuantityForDisplay converts stored quantity to display unit
func (c *Converter) DenormalizeQuantityForDisplay(
	storedQuantity int64,
	investmentType investmentv1.InvestmentType,
	displayUnit SilverUnit,
) float64 {
	storageUnit, _ := GetNativeStorageInfo(investmentType)
	inStorageUnits := float64(storedQuantity) / 10000

	return ConvertQuantity(inStorageUnits, storageUnit, displayUnit)
}

// ===== COST CALCULATIONS (Unit + Currency) =====

// CalculateTotalCostFromUserInput calculates total cost from user-entered data
// Handles BOTH unit conversion AND currency conversion
func (c *Converter) CalculateTotalCostFromUserInput(
	ctx context.Context,
	userQuantity float64,
	userQuantityUnit SilverUnit,
	userPricePerUnit float64,
	userPriceCurrency string,
	userPriceUnit SilverUnit,
	investmentType investmentv1.InvestmentType,
	walletCurrency string,
) (totalCostNative int64, totalCostWallet int64, averageCostNative int64, err error) {
	storageUnit, nativeCurrency := GetNativeStorageInfo(investmentType)

	// LAYER 1: Convert quantity to storage unit
	quantityInStorageUnit := ConvertQuantity(userQuantity, userQuantityUnit, storageUnit)

	// LAYER 1: Convert price to storage unit price
	priceInStorageUnitCurrency := ConvertPricePerUnit(userPricePerUnit, userPriceUnit, storageUnit)

	// Calculate total cost in price's currency
	totalCostInPriceCurrency := priceInStorageUnitCurrency * quantityInStorageUnit
	averageCostInPriceCurrency := priceInStorageUnitCurrency

	// LAYER 2: Convert to native currency if needed
	totalCostInNativeCurrency := totalCostInPriceCurrency
	averageCostInNativeCurrency := averageCostInPriceCurrency

	if userPriceCurrency != nativeCurrency {
		rate, err := c.fxService.GetRate(ctx, userPriceCurrency, nativeCurrency)
		if err != nil {
			return 0, 0, 0, fmt.Errorf("get FX rate %s->%s: %w", userPriceCurrency, nativeCurrency, err)
		}

		multiplierFrom := fx.GetDecimalMultiplier(userPriceCurrency)
		multiplierTo := fx.GetDecimalMultiplier(nativeCurrency)

		totalCostInSmallestFrom := int64(math.Round(totalCostInPriceCurrency * float64(multiplierFrom)))
		totalCostInSmallestTo, _ := c.fxService.ConvertAmountWithRate(
			ctx,
			totalCostInSmallestFrom,
			rate,
			userPriceCurrency,
			nativeCurrency,
		)

		totalCostInNativeCurrency = float64(totalCostInSmallestTo) / float64(multiplierTo)

		avgCostInSmallestFrom := int64(math.Round(priceInStorageUnitCurrency * float64(multiplierFrom)))
		avgCostInSmallestTo, _ := c.fxService.ConvertAmountWithRate(
			ctx,
			avgCostInSmallestFrom,
			rate,
			userPriceCurrency,
			nativeCurrency,
		)
		averageCostInNativeCurrency = float64(avgCostInSmallestTo) / float64(multiplierTo)
	}

	// Convert to smallest currency units for storage
	multiplierNative := fx.GetDecimalMultiplier(nativeCurrency)
	totalCostNative = int64(math.Round(totalCostInNativeCurrency * float64(multiplierNative)))
	averageCostNative = int64(math.Round(averageCostInNativeCurrency * float64(multiplierNative)))

	// LAYER 2: Convert to wallet currency for balance operations
	totalCostWallet = totalCostNative
	if nativeCurrency != walletCurrency {
		converted, err := c.fxService.ConvertAmount(
			ctx,
			totalCostNative,
			nativeCurrency,
			walletCurrency,
		)
		if err != nil {
			return 0, 0, 0, fmt.Errorf("convert to wallet currency: %w", err)
		}
		totalCostWallet = converted
	}

	return totalCostNative, totalCostWallet, averageCostNative, nil
}

// ProcessMarketPrice processes market price from API
// Market prices:
// - AG_VND_Tael (A4): VND silver per tael, need to convert to per gram for storage
// - AG_VND_Kg (K4): VND silver per kg, need to convert to per gram for storage
// - XAG: USD silver per ounce, already in storage format
// Storage needs: VND silver = per gram, USD silver = per ounce
func (c *Converter) ProcessMarketPrice(
	marketPrice int64,
	marketCurrency string,
	investmentType investmentv1.InvestmentType,
	symbol string,
) int64 {
	priceUnit := GetPriceUnitForMarketData(symbol)
	storageUnit, _ := GetNativeStorageInfo(investmentType)

	// If market price unit equals storage unit, no conversion needed
	if priceUnit == storageUnit {
		return marketPrice
	}

	// Need unit conversion (VND: per tael or per kg → per gram)
	priceInBaseUnits := float64(marketPrice) / float64(fx.GetDecimalMultiplier(marketCurrency))
	pricePerStorageUnit := ConvertPricePerUnit(priceInBaseUnits, priceUnit, storageUnit)

	return int64(math.Round(pricePerStorageUnit * float64(fx.GetDecimalMultiplier(marketCurrency))))
}

// CalculateDisplayQuantity formats quantity for display with unit
func (c *Converter) CalculateDisplayQuantity(
	storedQuantity int64,
	investmentType investmentv1.InvestmentType,
	purchaseUnit SilverUnit,
) (value float64, unit SilverUnit) {
	// Display in user's purchase unit
	value = c.DenormalizeQuantityForDisplay(storedQuantity, investmentType, purchaseUnit)
	return value, purchaseUnit
}
