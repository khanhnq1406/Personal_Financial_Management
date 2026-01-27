package yahoo

import (
	"context"
	"fmt"

	yahoofinance "github.com/oscarli916/yahoo-finance-api"
)

// Errors returned by the Yahoo Finance client
var (
	ErrSymbolNotFound    = fmt.Errorf("symbol not found")
	ErrInvalidResponse   = fmt.Errorf("invalid API response")
	ErrRateLimitExceeded = fmt.Errorf("rate limit exceeded")
)

// QuoteData holds parsed quote data from Yahoo Finance
type QuoteData struct {
	Symbol        string  // Ticker symbol
	Price         int64   // Current price in cents (multiply by 100)
	Change24h     float64 // 24h change percentage
	Volume24h     int64   // 24h volume
	Currency      string  // Currency code (USD, VND, etc.)
	PreviousClose int64   // Previous close price in cents
}

// Client wraps a Yahoo Finance Ticker
type Client struct {
	ticker *yahoofinance.Ticker
}

// NewClient creates a new Yahoo Finance client for the given symbol
func NewClient(symbol string) *Client {
	return &Client{
		ticker: yahoofinance.NewTicker(symbol),
	}
}

// GetQuote fetches current quote data for the symbol
// It uses the History API with a 1-day range to get current market data
// This method respects the global rate limiter to prevent exceeding API limits
func (c *Client) GetQuote(ctx context.Context) (*QuoteData, error) {
	// Respect the rate limit
	if err := GetGlobalThrottler().Wait(ctx); err != nil {
		return nil, fmt.Errorf("rate limit wait failed: %w", err)
	}

	// Create a history query for the last day
	// Use the 1d range which gives us intraday and current data
	query := yahoofinance.HistoryQuery{}
	query.SetDefault()
	query.Range = "1d"
	query.Interval = "1d"

	// Use the internal History struct to get full metadata including current price
	history := &yahoofinance.History{}
	history.SetQuery(query)

	result, err := history.GetHistory(c.ticker.Symbol)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch quote history: %w", err)
	}

	// Validate response
	if len(result.Chart.Result) == 0 {
		return nil, ErrSymbolNotFound
	}

	chartResult := result.Chart.Result[0]
	meta := chartResult.Meta

	// Extract and validate data from meta
	symbol := meta.Symbol
	if symbol == "" {
		return nil, ErrSymbolNotFound
	}

	// Get regular market price (convert to cents)
	priceInCents := int64(meta.RegularMarketPrice * 100)

	// Get previous close price (convert to cents)
	previousClose := int64(meta.PreviousClose * 100)

	// Get 24h volume
	volume24h := meta.RegularMarketVolume

	// Get currency
	currency := meta.Currency
	if currency == "" {
		currency = "USD" // Default to USD if not specified
	}

	// Calculate 24h change percentage
	// Yahoo Finance doesn't provide this directly in meta, so we calculate it
	var change24h float64
	if previousClose > 0 {
		change24h = ((float64(priceInCents) - float64(previousClose)) / float64(previousClose)) * 100
	}

	return &QuoteData{
		Symbol:        symbol,
		Price:         priceInCents,
		Change24h:     change24h,
		Volume24h:     volume24h,
		Currency:      currency,
		PreviousClose: previousClose,
	}, nil
}

// GetSymbol returns the ticker symbol for this client
func (c *Client) GetSymbol() string {
	return c.ticker.Symbol
}
