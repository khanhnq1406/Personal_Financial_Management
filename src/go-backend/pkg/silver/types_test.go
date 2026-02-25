package silver

import (
	"testing"

	investmentv1 "wealthjourney/protobuf/v1"
)

func TestGetSilverTypeByCode_NewTypes(t *testing.T) {
	tests := []struct {
		code     string
		wantName string
		wantCurr string
	}{
		{"GOLDENFUND_1L", "Golden Fund 1 Lượng", "VND"},
		{"ANCARAT_1KG", "Ancarat 1 Kg", "VND"},
		{"XAGUSD", "Silver World (XAG/USD)", "USD"},
	}

	for _, tt := range tests {
		t.Run(tt.code, func(t *testing.T) {
			st := GetSilverTypeByCode(tt.code)
			if st == nil {
				t.Fatalf("Expected silver type for %s, got nil", tt.code)
			}
			if st.Name != tt.wantName {
				t.Errorf("Name = %s, want %s", st.Name, tt.wantName)
			}
			if st.Currency != tt.wantCurr {
				t.Errorf("Currency = %s, want %s", st.Currency, tt.wantCurr)
			}
		})
	}
}

func TestGetSilverTypeByCode_RemovedTypes(t *testing.T) {
	removedCodes := []string{"AG_VND_Tael", "AG_VND_Kg", "AG_VND"}

	for _, code := range removedCodes {
		t.Run(code, func(t *testing.T) {
			st := GetSilverTypeByCode(code)
			if st != nil {
				t.Errorf("Expected nil for removed type %s, got %+v", code, st)
			}
		})
	}
}

func TestGetPriceUnitForMarketData_NewTypes(t *testing.T) {
	tests := []struct {
		symbol   string
		wantUnit SilverUnit
	}{
		{"GOLDENFUND_1L", UnitTael},
		{"ANCARAT_5L", UnitTael},
		{"PHUQUY_1KG", UnitKg},
		{"XAGUSD", UnitOunce},
	}

	for _, tt := range tests {
		t.Run(tt.symbol, func(t *testing.T) {
			got := GetPriceUnitForMarketData(tt.symbol)
			if got != tt.wantUnit {
				t.Errorf("GetPriceUnitForMarketData(%s) = %s, want %s", tt.symbol, got, tt.wantUnit)
			}
		})
	}
}

func TestProcessMarketPrice_BarSize(t *testing.T) {
	c := &Converter{} // fxService not needed for ProcessMarketPrice

	tests := []struct {
		name      string
		symbol    string
		price     int64 // Market price in VND (VND has multiplier 1)
		currency  string
		invType   investmentv1.InvestmentType
		wantPrice int64 // Expected per-gram price in VND
	}{
		{
			name:      "GOLDENFUND_1L per-unit price: 1,366,000 VND/tael → per gram",
			symbol:    "GOLDENFUND_1L",
			price:     1366000,
			currency:  "VND",
			invType:   investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_VND,
			wantPrice: 36427, // 1,366,000 / 37.5 = 36,426.67 → rounded
		},
		{
			name:      "GOLDENFUND_5L 5-bar price: 6,830,000 VND/5L bar → per gram",
			symbol:    "GOLDENFUND_5L",
			price:     6830000,
			currency:  "VND",
			invType:   investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_VND,
			wantPrice: 36427, // 6,830,000 / 5 / 37.5 = 36,426.67 → rounded
		},
		{
			name:      "GOLDENFUND_10L 10-bar price: 13,660,000 VND/10L bar → per gram",
			symbol:    "GOLDENFUND_10L",
			price:     13660000,
			currency:  "VND",
			invType:   investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_VND,
			wantPrice: 36427, // 13,660,000 / 10 / 37.5 = 36,426.67 → rounded
		},
		{
			name:      "PHUQUY_5L per-unit price (barSize=1): 3,384,000 VND/tael → per gram",
			symbol:    "PHUQUY_5L",
			price:     3384000,
			currency:  "VND",
			invType:   investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_VND,
			wantPrice: 90240, // 3,384,000 / 37.5 = 90,240
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := c.ProcessMarketPrice(tt.price, tt.currency, tt.invType, tt.symbol)
			if got != tt.wantPrice {
				t.Errorf("ProcessMarketPrice(%d, %s, %s) = %d, want %d",
					tt.price, tt.currency, tt.symbol, got, tt.wantPrice)
			}
		})
	}
}
