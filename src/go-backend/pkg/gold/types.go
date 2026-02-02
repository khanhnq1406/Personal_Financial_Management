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
		Name:       "SJC 9999",
		Currency:   "VND",
		Unit:       UnitTael,
		UnitWeight: GramsPerTael,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "SJ9999",
		Name:       "Nhẫn SJC",
		Currency:   "VND",
		Unit:       UnitTael,
		UnitWeight: GramsPerTael,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "DOHNL",
		Name:       "DOJI Hà Nội",
		Currency:   "VND",
		Unit:       UnitTael,
		UnitWeight: GramsPerTael,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "DOHCML",
		Name:       "DOJI HCM",
		Currency:   "VND",
		Unit:       UnitTael,
		UnitWeight: GramsPerTael,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "DOJINHTV",
		Name:       "DOJI Nữ Trang",
		Currency:   "VND",
		Unit:       UnitTael,
		UnitWeight: GramsPerTael,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "BTSJC",
		Name:       "Bảo Tín SJC",
		Currency:   "VND",
		Unit:       UnitGram,
		UnitWeight: GramsPerTael,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "BT9999NTT",
		Name:       "Bảo Tín 9999",
		Currency:   "VND",
		Unit:       UnitGram,
		UnitWeight: GramsPerTael,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "PQHNVM",
		Name:       "PNJ Hà Nội",
		Currency:   "VND",
		Unit:       UnitGram,
		UnitWeight: GramsPerTael,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "PQHN24NTT",
		Name:       "PNJ 24K",
		Currency:   "VND",
		Unit:       UnitGram,
		UnitWeight: GramsPerTael,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "VNGSJC",
		Name:       "VN Gold SJC",
		Currency:   "VND",
		Unit:       UnitGram,
		UnitWeight: GramsPerTael,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	{
		Code:       "VIETTINMSJC",
		Name:       "Viettin SJC",
		Currency:   "VND",
		Unit:       UnitGram,
		UnitWeight: GramsPerTael,
		Type:       investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND,
	},
	// World gold (USD pricing, ounce-based)
	{
		Code:       "XAUUSD",
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
