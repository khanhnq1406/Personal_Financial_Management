package yahoo

import (
	"context"
	"fmt"
)

// Example usage of the Yahoo Finance client
func ExampleClient() {
	// Create a new client for a stock symbol
	client := NewClient("AAPL")
	// Fetch current quote data
	ctx := context.Background()
	quote, err := client.GetQuote(ctx)
	if err != nil {
		fmt.Printf("Error fetching quote: %v\n", err)
		return
	}

	// Use the quote data
	fmt.Printf("Symbol: %s\n", quote.Symbol)
	fmt.Printf("Price: $%d.%02d\n", quote.Price/100, quote.Price%100)
	fmt.Printf("Change (24h): %.2f%%\n", quote.Change24h)
	fmt.Printf("Volume (24h): %d\n", quote.Volume24h)
	fmt.Printf("Currency: %s\n", quote.Currency)
	fmt.Printf("Previous Close: $%d.%02d\n", quote.PreviousClose/100, quote.PreviousClose%100)
}
