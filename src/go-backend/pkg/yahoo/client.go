package yahoo

import (
	"context"
	"fmt"
	"strings"

	yahoofinance "github.com/oscarli916/yahoo-finance-api"
)

// Errors returned by the Yahoo Finance client
var (
	ErrSymbolNotFound  = fmt.Errorf("symbol not found")
	ErrInvalidResponse = fmt.Errorf("invalid API response")
)

// QuoteData holds parsed quote data from Yahoo Finance
type QuoteData struct {
	Symbol    string // Ticker symbol
	Price     int64  // Current price in cents (multiply by 100)
	Volume24h int64  // 24h volume
}

// Client wraps a Yahoo Finance Ticker
type Client struct {
	ticker *yahoofinance.Ticker
}

// NewClient creates a new Yahoo Finance client for the given symbol
func NewClient(symbol string) *Client {
	// Validate symbol format
	if symbol == "" {
		return nil
	}

	// Clean symbol - remove common prefixes/suffixes that might cause issues
	cleanSymbol := strings.ToUpper(strings.TrimSpace(symbol))
	if cleanSymbol != symbol {
		symbol = cleanSymbol
	}

	ticker := yahoofinance.NewTicker(symbol)
	if ticker == nil {
		return nil
	}
	return &Client{
		ticker: ticker,
	}
}

// GetQuote fetches current quote data for the symbol
// It uses the Quote() method from yahoo-finance-api package
// This method respects the global rate limiter to prevent exceeding API limits
func (c *Client) GetQuote(ctx context.Context) (*QuoteData, error) {
	// Respect the rate limit
	if err := GetGlobalThrottler().Wait(ctx); err != nil {
		return nil, fmt.Errorf("rate limit wait failed: %w", err)
	}

	// Validate ticker
	if c.ticker == nil {
		return nil, fmt.Errorf("ticker is not initialized")
	}

	// Validate symbol
	if c.ticker.Symbol == "" {
		return nil, fmt.Errorf("ticker symbol is empty")
	}

	// Wrap entire API call in panic recovery
	defer func() {
		if r := recover(); r != nil {
			// Log the panic but don't crash the server
			fmt.Printf("Recovered from Yahoo Finance API panic: %v\n", r)
		}
	}()

	// Use Quote() method to get latest price data
	priceData, err := c.ticker.Quote()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch quote: %w", err)
	}

	// Validate response - check if we got valid data
	if priceData.Close == 0 {
		return nil, ErrSymbolNotFound
	}

	// Convert price to cents (integer for precision)
	priceInCents := int64(priceData.Close * 100)

	return &QuoteData{
		Symbol:    c.ticker.Symbol,
		Price:     priceInCents,
		Volume24h: priceData.Volume,
	}, nil
}

// GetSymbol returns the ticker symbol for this client
func (c *Client) GetSymbol() string {
	return c.ticker.Symbol
}
