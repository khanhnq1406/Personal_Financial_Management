package gold

import (
	investmentv1 "wealthjourney/protobuf/v1"
)

const (
	// GramsPerTael is the conversion factor for Vietnamese tael to grams
	// 1 tael (lượng) = 37.5 grams
	GramsPerTael = 37.5

	// GramsPerOunce is the conversion factor for troy ounce to grams
	// 1 troy ounce = 31.1034768 grams
	GramsPerOunce = 31.1034768
)

// GoldUnit represents the physical unit for gold quantity
type GoldUnit string

const (
	UnitGram  GoldUnit = "gram"
	UnitTael  GoldUnit = "tael"
	UnitOunce GoldUnit = "oz"
)

// GoldType defines a gold type available from vang.today
type GoldType struct {
	Code       string                      // Type code (e.g., "SJL1L10", "XAU")
	Name       string                      // Display name
	Currency   string                      // "VND" or "USD"
	Unit       GoldUnit                    // "tael", "gram", or "oz"
	UnitWeight float64                     // Weight in grams
	Type       investmentv1.InvestmentType // InvestmentType enum value
}

// GoldTypes is the registry of all supported gold types
var GoldTypes = []GoldType{
	// Vietnamese gold (VND pricing, tael-based)
	{
		Code:       "SJL1L10",
		Name:       "SJC 1L-10L",
		Currency:   "VND",
		Unit:       UnitTael,
		UnitWeight: GramsPerTael,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "SJL1L2",
		Name:       "SJC 1L-2L",
		Currency:   "VND",
		Unit:       UnitTael,
		UnitWeight: GramsPerTael,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "SJL5C",
		Name:       "SJC 5 chỉ",
		Currency:   "VND",
		Unit:       UnitTael,
		UnitWeight: 3.75, // 5 chỉ = 0.5 tael = 18.75g, but stored per tael
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "SJL1C",
		Name:       "SJC 1 chỉ",
		Currency:   "VND",
		Unit:       UnitTael,
		UnitWeight: 1.875, // 1 chỉ = 0.1 tael = 3.75g, but stored per tael
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "SJL0_5C",
		Name:       "SJC 0.5 chỉ",
		Currency:   "VND",
		Unit:       UnitTael,
		UnitWeight: 0.9375, // 0.5 chỉ = 0.05 tael = 1.875g
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "SJR2",
		Name:       "SJC Nhẫn 2-5 chỉ",
		Currency:   "VND",
		Unit:       UnitGram,
		UnitWeight: 1.0,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "SJR1",
		Name:       "SJC Nhẫn 1 chỉ",
		Currency:   "VND",
		Unit:       UnitGram,
		UnitWeight: 1.0,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "SJT99",
		Name:       "SJC Trang sức 99.99",
		Currency:   "VND",
		Unit:       UnitGram,
		UnitWeight: 1.0,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "SJT98",
		Name:       "SJC Trang sức 99.98",
		Currency:   "VND",
		Unit:       UnitGram,
		UnitWeight: 1.0,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "SJT97",
		Name:       "SJC Trang sức 99.97",
		Currency:   "VND",
		Unit:       UnitGram,
		UnitWeight: 1.0,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	// World gold (USD pricing, ounce-based)
	{
		Code:       "XAU",
		Name:       "Gold World (XAU/USD)",
		Currency:   "USD",
		Unit:       UnitOunce,
		UnitWeight: GramsPerOunce,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_USD,
	},
}

// GetGoldTypeByCode returns the gold type definition for a given code
func GetGoldTypeByCode(code string) *GoldType {
	for _, gt := range GoldTypes {
		if gt.Code == code {
			return &gt
		}
	}
	return nil
}

// GetGoldTypesByCurrency returns all gold types for a given currency
func GetGoldTypesByCurrency(currency string) []GoldType {
	var result []GoldType
	for _, gt := range GoldTypes {
		if gt.Currency == currency {
			result = append(result, gt)
		}
	}
	return result
}

// GetNativeStorageInfo returns the storage unit and native currency for a gold investment type
func GetNativeStorageInfo(investmentType investmentv1.InvestmentType) (GoldUnit, string) {
	switch investmentType {
	case investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND:
		return UnitGram, "VND" // Store VND gold in grams
	case investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_USD:
		return UnitOunce, "USD" // Store USD gold in ounces
	default:
		return UnitGram, "USD"
	}
}

// GetPriceUnitForMarketData returns what unit market prices are in
func GetPriceUnitForMarketData(investmentType investmentv1.InvestmentType) GoldUnit {
	switch investmentType {
	case investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND:
		return UnitTael // VND gold market price is per tael
	case investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_USD:
		return UnitOunce // World gold market price is per ounce
	default:
		return UnitOunce
	}
}

// IsGoldType checks if an investment type is a gold type
func IsGoldType(t investmentv1.InvestmentType) bool {
	return t == investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND ||
		t == investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_USD
}
