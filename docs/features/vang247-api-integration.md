# Vang247 API Integration

## Overview

The application uses the vang247.vn unified API for fetching real-time gold and silver prices across multiple Vietnamese and international markets.

**API Endpoint:** `https://services.vang247.vn/ws-prices/api/v1/c_prices`

## API Response Structure

The API returns a comprehensive JSON response with:

- **sjcNationWide**: SJC gold prices (primary Vietnamese gold)
- **goldNationWide**: Other gold types (999.9, 24K, etc.)
- **silver_price**: Silver prices (multiple brands and units)
- **currencyNationWide**: FX exchange rates
- **Other fields**: Golden Fund products, news, calendar events

## Price Formats

### VND Prices

All VND prices in the API are returned in **VND x 1000** format:
- API returns: `182300` = 182,300,000 VND per tael
- Backend converts to: `182300000` (VND x 1) for storage

### USD Prices

USD prices are returned in **dollars with 2 decimal places**:
- API returns: `5182.61` = $5,182.61 per ounce
- Backend converts to: `518261` (cents) for storage

## Supported Gold Types (18 types)

All VND gold types use tael as the market price unit. API prices are in VND x 1000 per tael.

| Code | Name | Currency | Unit |
|------|------|----------|------|
| SJC | SJC 9999 | VND | tael |
| SJC TD | SJC Tu Do | VND | tael |
| Eximbank | Eximbank SJC | VND | tael |
| TPBank | TPBank SJC | VND | tael |
| Doji | DOJI | VND | tael |
| VietinGold | VietinBank Gold | VND | tael |
| ACBBank | ACB Gold | VND | tael |
| Mi hong | Mi Hong Gold | VND | tael |
| BTMC | Bao Tin SJC | VND | tael |
| 999,9 TD | Vang 999.9 Tu Do | VND | tael |
| 99,9 TD | Vang 99.9 Tu Do | VND | tael |
| Vang 95% | Vang 95% | VND | tael |
| Doji_24K | DOJI 24K | VND | tael |
| BTMC_24K | Bao Tin 24K | VND | tael |
| Mihong_999 | Mi Hong 999 | VND | tael |
| 99,99% GF | Golden Fund 99.99% | VND | tael |
| 95% GF | Golden Fund 95% | VND | tael |
| XAUUSD | Gold World (XAU/USD) | USD | ounce |

## Supported Silver Types (11 types)

| Code | Name | Currency | Unit |
|------|------|----------|------|
| GOLDENFUND_1L | Golden Fund 1 Luong | VND | tael |
| GOLDENFUND_5L | Golden Fund 5 Luong | VND | tael |
| GOLDENFUND_10L | Golden Fund 10 Luong | VND | tael |
| GOLDENFUND_1KG | Golden Fund 1 Kg | VND | kg |
| PHUQUY_1L | Phu Quy 1 Luong | VND | tael |
| PHUQUY_5L | Phu Quy 5 Luong | VND | tael |
| PHUQUY_1KG | Phu Quy 1 Kg | VND | kg |
| ANCARAT_1L | Ancarat 1 Luong | VND | tael |
| ANCARAT_5L | Ancarat 5 Luong | VND | tael |
| ANCARAT_1KG | Ancarat 1 Kg | VND | kg |
| XAGUSD | Silver World (XAG/USD) | USD | ounce |

**Note:** XAGUSD uses Yahoo Finance API for more reliable pricing.

## Caching Strategy

- **Cache TTL**: 15 minutes
- **Cache Key**: Type code (e.g., "SJC", "ANCARAT_1L")
- **Cache Storage**: Redis with JSON serialization
- **Fallback**: Return cached data on API failure

## Migration from Previous API

### Old to New Mappings

**Gold:**
- SJL1L10, SJ9999 -> SJC
- DOHNL, DOHCML -> Doji
- BTSJC -> BTMC
- BT9999NTT -> BTMC_24K
- VNGSJC, VIETTINMSJC -> VietinGold

**Silver:**
- AG_VND_Tael -> ANCARAT_1L (default)
- AG_VND_Kg -> ANCARAT_1KG (default)
- XAG -> XAGUSD

### Migration Script

Run: `task backend:migrate-gold-silver-types`

This updates existing investment records to use new type codes.

## API Client Usage

```go
import "wealthjourney/pkg/vang247"

client := vang247.NewClient(10 * time.Second)

// Fetch all prices
prices, err := client.FetchPrices(ctx)

// Fetch specific gold price
goldPrice, err := client.FetchGoldPrice(ctx, "SJC")

// Fetch specific silver price
silverPrice, err := client.FetchSilverPrice(ctx, "ANCARAT_1L")
```

## Frontend Integration

Gold and silver type dropdowns sync with backend registry:

- **Gold**: `lib/utils/gold-calculator.ts` - `GOLD_VND_OPTIONS` and `GOLD_USD_OPTIONS`
- **Silver**: `lib/utils/silver-calculator.ts` - `SILVER_VND_OPTIONS` and `SILVER_USD_OPTIONS`

---

**Last Updated:** 2026-02-25
