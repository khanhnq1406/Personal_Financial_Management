package silver

import investmentv1 "wealthjourney/protobuf/v1"

const (
	GramsPerTael  = 37.5
	GramsPerOunce = 31.1034768
	GramsPerKg    = 1000.0
)

type SilverUnit string

const (
	UnitGram  SilverUnit = "gram"
	UnitTael  SilverUnit = "tael" // lượng
	UnitKg    SilverUnit = "kg"
	UnitOunce SilverUnit = "oz"
)

type SilverType struct {
	Code     string                      // "AG_VND", "XAG"
	Name     string                      // Display name
	Currency string                      // "VND" or "USD"
	Type     investmentv1.InvestmentType // Enum value
}

var SilverTypes = []SilverType{
	{
		Code:     "AG_VND_Tael",
		Name:     "Bạc Việt Nam (VND) - Lượng",
		Currency: "VND",
		Type:     investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_VND,
	},
	{
		Code:     "AG_VND_Kg",
		Name:     "Bạc Việt Nam (VND) - Kg",
		Currency: "VND",
		Type:     investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_VND,
	},
	{
		Code:     "XAG",
		Name:     "Silver World (XAG/USD)",
		Currency: "USD",
		Type:     investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_USD,
	},
}

// GetNativeStorageInfo returns storage unit and native currency
func GetNativeStorageInfo(investmentType investmentv1.InvestmentType) (SilverUnit, string) {
	switch investmentType {
	case investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_VND:
		return UnitGram, "VND" // Store VND silver in grams
	case investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_USD:
		return UnitOunce, "USD" // Store USD silver in ounces
	default:
		return UnitGram, "USD"
	}
}

// GetPriceUnitForMarketData returns what unit market prices are in
func GetPriceUnitForMarketData(investmentType investmentv1.InvestmentType) SilverUnit {
	switch investmentType {
	case investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_VND:
		return UnitTael // ancarat API price is per tael
	case investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_USD:
		return UnitOunce // Yahoo Finance XAG is per ounce
	default:
		return UnitOunce
	}
}

func IsSilverType(t investmentv1.InvestmentType) bool {
	return t == investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_VND ||
		t == investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_USD
}

func GetSilverTypeByCode(code string) *SilverType {
	// Handle legacy AG_VND code - return first VND type (tael)
	if code == "AG_VND" {
		return &SilverTypes[0]
	}
	// Handle new unit-specific codes
	for _, st := range SilverTypes {
		if st.Code == code {
			return &st
		}
	}
	return nil
}

func GetSilverTypesByCurrency(currency string) []SilverType {
	var result []SilverType
	for _, st := range SilverTypes {
		if st.Currency == currency {
			result = append(result, st)
		}
	}
	return result
}
