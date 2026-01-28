package yahoo

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// quoteFields is the list of fields to request from Yahoo Finance v7 quote API
var quoteFields = []string{
	"currency",
	"fromCurrency",
	"toCurrency",
	"exchangeTimezoneName",
	"exchangeTimezoneShortName",
	"gmtOffSetMilliseconds",
	"regularMarketChange",
	"regularMarketChangePercent",
	"regularMarketPrice",
	"regularMarketTime",
	"preMarketChange",
	"preMarketChangePercent",
	"preMarketPrice",
	"preMarketTime",
	"priceHint",
	"postMarketChange",
	"postMarketChangePercent",
	"postMarketPrice",
	"postMarketTime",
	"extendedMarketChange",
	"extendedMarketChangePercent",
	"extendedMarketPrice",
	"extendedMarketTime",
	"overnightMarketChange",
	"overnightMarketChangePercent",
	"overnightMarketPrice",
	"overnightMarketTime",
}

// QuoteResult represents a comprehensive quote result from Yahoo Finance v7 API
type QuoteResult struct {
	Symbol                     string  `json:"symbol"`
	Currency                   string  `json:"currency"`
	RegularMarketPrice         float64 `json:"regularMarketPrice"`
	RegularMarketChange        float64 `json:"regularMarketChange"`
	RegularMarketChangePercent float64 `json:"regularMarketChangePercent"`
	RegularMarketPreviousClose float64 `json:"regularMarketPreviousClose"`
	RegularMarketTime          int64   `json:"regularMarketTime"`
	MarketState                string  `json:"marketState"`
	Exchange                   string  `json:"exchange"`
	ExchangeTimezoneName       string  `json:"exchangeTimezoneName"`
	ExchangeTimezoneShortName  string  `json:"exchangeTimezoneShortName"`
	GmtOffSetMilliseconds      int64   `json:"gmtOffSetMilliseconds"`
	PriceHint                  int     `json:"priceHint"`
	FullExchangeName           string  `json:"fullExchangeName"`
	QuoteType                  string  `json:"quoteType"`
}

type yahooQuoteResponse struct {
	QuoteResponse struct {
		Result []json.RawMessage `json:"result"`
		Error  *struct {
			Code        string `json:"code"`
			Description string `json:"description"`
		} `json:"error"`
	} `json:"quoteResponse"`
}

// buildQuoteURL constructs the URL for Yahoo Finance v7 quote API
func buildQuoteURL(symbol string) string {
	baseURL := "https://query2.finance.yahoo.com/v7/finance/quote"
	values := url.Values{}

	values.Set("symbols", symbol)
	values.Set("fields", strings.Join(quoteFields, ","))
	values.Set("formatted", "false")
	values.Set("region", "US")
	values.Set("lang", "en-US")

	return fmt.Sprintf("%s?%s", baseURL, values.Encode())
}

// GetQuote fetches comprehensive quote data for a single symbol
// Uses Yahoo Finance v7 quote API with rate limiting
func GetQuote(ctx context.Context, symbol string) (*QuoteResult, error) {
	symbol = strings.TrimSpace(symbol)
	if symbol == "" {
		return nil, fmt.Errorf("symbol cannot be empty")
	}

	// Respect rate limiting
	if err := GetGlobalThrottler().Wait(ctx); err != nil {
		return nil, fmt.Errorf("rate limit wait failed: %w", err)
	}

	quoteURL := buildQuoteURL(symbol)
	reqCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, "GET", quoteURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
	req.Header.Set("Accept", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var yahooResp yahooQuoteResponse
	if err := json.Unmarshal(body, &yahooResp); err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %w", err)
	}

	// Check for API errors
	if yahooResp.QuoteResponse.Error != nil {
		return nil, fmt.Errorf("API error: %s - %s", yahooResp.QuoteResponse.Error.Code, yahooResp.QuoteResponse.Error.Description)
	}

	// Check if we got results
	if len(yahooResp.QuoteResponse.Result) == 0 {
		return nil, ErrSymbolNotFound
	}

	// Parse the first result
	var result QuoteResult
	if err := json.Unmarshal(yahooResp.QuoteResponse.Result[0], &result); err != nil {
		return nil, fmt.Errorf("failed to parse quote result: %w", err)
	}

	return &result, nil
}

// buildQuoteURLForMultiple constructs URL for multiple symbols
func buildQuoteURLForMultiple(symbols []string) string {
	baseURL := "https://query2.finance.yahoo.com/v7/finance/quote"
	values := url.Values{}

	values.Set("symbols", strings.Join(symbols, ","))
	values.Set("fields", strings.Join(quoteFields, ","))
	values.Set("formatted", "false")
	values.Set("region", "US")
	values.Set("lang", "en-US")

	return fmt.Sprintf("%s?%s", baseURL, values.Encode())
}

// GetQuoteBatch fetches quotes for multiple symbols in a single API call.
// Returns a map of symbol to QuoteResult. Note: if some symbols fail to parse,
// they will be silently omitted from the results. The map may contain fewer
// entries than the number of input symbols. Check that len(results) matches
// your expectations if you need all symbols to succeed.
func GetQuoteBatch(ctx context.Context, symbols []string) (map[string]*QuoteResult, error) {
	if len(symbols) == 0 {
		return nil, fmt.Errorf("symbols list cannot be empty")
	}

	// Clean and validate symbols
	var cleanedSymbols []string
	for _, s := range symbols {
		s = strings.TrimSpace(s)
		if s == "" {
			continue
		}
		cleanedSymbols = append(cleanedSymbols, s)
	}

	if len(cleanedSymbols) == 0 {
		return nil, fmt.Errorf("no valid symbols provided")
	}

	// Respect rate limiting
	if err := GetGlobalThrottler().Wait(ctx); err != nil {
		return nil, fmt.Errorf("rate limit wait failed: %w", err)
	}

	quoteURL := buildQuoteURLForMultiple(cleanedSymbols)
	reqCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, "GET", quoteURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
	req.Header.Set("Accept", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var yahooResp yahooQuoteResponse
	if err := json.Unmarshal(body, &yahooResp); err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %w", err)
	}

	// Check for API errors
	if yahooResp.QuoteResponse.Error != nil {
		return nil, fmt.Errorf("API error: %s - %s", yahooResp.QuoteResponse.Error.Code, yahooResp.QuoteResponse.Error.Description)
	}

	// Parse results into a map
	// Note: Invalid individual results are silently skipped to allow partial success
	results := make(map[string]*QuoteResult)
	for _, rawResult := range yahooResp.QuoteResponse.Result {
		var quote QuoteResult
		if err := json.Unmarshal(rawResult, &quote); err != nil {
			// Skip invalid results but continue parsing others
			continue
		}
		results[quote.Symbol] = &quote
	}

	return results, nil
}

// ToSmallestCurrencyUnit converts a float price to int64 in smallest currency unit.
// For example: 150.25 USD -> 15025 (cents), 69600 VND -> 6960000 (smallest unit).
// Uses the priceHint field from Yahoo Finance to determine decimal places.
func ToSmallestCurrencyUnit(price float64, priceHint int) int64 {
	// priceHint indicates the number of decimal places
	// 2 = 2 decimal places (cents), 0 = whole numbers
	decimalPlaces := 2 // default to 2 decimal places
	if priceHint > 0 && priceHint <= 8 {
		decimalPlaces = priceHint
	}

	multiplier := 1
	for i := 0; i < decimalPlaces; i++ {
		multiplier *= 10
	}

	return int64(price * float64(multiplier))
}
