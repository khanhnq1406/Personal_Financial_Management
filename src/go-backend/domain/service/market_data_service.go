package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"wealthjourney/domain/models"
	"wealthjourney/domain/repository"
	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/validator"
	"wealthjourney/pkg/yahoo"
)

// MarketDataService handles market data operations including price fetching and caching.
type MarketDataService interface {
	// GetPrice retrieves the current price for a symbol, using cache if fresh.
	GetPrice(ctx context.Context, symbol, currency string, maxAge time.Duration) (*models.MarketData, error)

	// UpdatePricesForInvestments updates prices for multiple investments.
	UpdatePricesForInvestments(ctx context.Context, investments []*models.Investment, forceRefresh bool) (map[int32]int64, error)
}

// marketDataService implements MarketDataService.
type marketDataService struct {
	marketDataRepo repository.MarketDataRepository
}

// NewMarketDataService creates a new MarketDataService.
func NewMarketDataService(marketDataRepo repository.MarketDataRepository) MarketDataService {
	return &marketDataService{
		marketDataRepo: marketDataRepo,
	}
}

// GetPrice retrieves the current price for a symbol, using cache if fresh.
// If cached data is older than maxAge or doesn't exist, fetches from external API.
func (s *marketDataService) GetPrice(ctx context.Context, symbol, currency string, maxAge time.Duration) (*models.MarketData, error) {
	// Validate inputs
	if symbol == "" {
		return nil, apperrors.NewValidationError("symbol is required")
	}
	if err := validator.Currency(currency); err != nil {
		return nil, err
	}

	// Try to get cached data
	cached, err := s.marketDataRepo.GetBySymbolAndCurrency(ctx, symbol, currency)
	if err == nil && !cached.IsExpired(maxAge) {
		// Cache hit and data is fresh
		return cached, nil
	}

	// Cache miss or expired data - fetch from API
	priceData, err := s.fetchPriceFromAPI(ctx, symbol, currency)
	if err != nil {
		// If we have expired cached data, return it as fallback
		if cached != nil {
			log.Printf("Warning: API fetch failed for %s, using stale cache: %v", symbol, err)
			return cached, nil
		}
		// Return a more user-friendly error for API failures
		return nil, fmt.Errorf("unable to fetch current price for %s. Please try again later. Error: %w", symbol, err)
	}

	// Store in cache
	priceData.Timestamp = time.Now()
	if cached != nil && cached.ID > 0 {
		priceData.ID = cached.ID
		if err := s.marketDataRepo.Update(ctx, priceData); err != nil {
			// Log error but don't fail the request
			log.Printf("Warning: failed to update cached market data: %v\n", err)
		}
	} else {
		if err := s.marketDataRepo.Create(ctx, priceData); err != nil {
			// Log error but don't fail the request
			log.Printf("Warning: failed to cache market data: %v\n", err)
		}
	}

	return priceData, nil
}

// UpdatePricesForInvestments updates prices for multiple investments.
// Returns a map of investment ID to updated price.
func (s *marketDataService) UpdatePricesForInvestments(ctx context.Context, investments []*models.Investment, forceRefresh bool) (map[int32]int64, error) {
	updates := make(map[int32]int64)
	maxAge := 15 * time.Minute // Default cache age
	if forceRefresh {
		maxAge = 0 // Force refresh
	}

	for _, investment := range investments {
		// Add defensive programming to handle individual investment failures
		func() {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("Warning: panic while getting price for %s: %v\n", investment.Symbol, r)
				}
			}()

			// Get price for this investment
			priceData, err := s.GetPrice(ctx, investment.Symbol, investment.Currency, maxAge)
			if err != nil {
				// Log error but continue with other investments
				log.Printf("Warning: failed to get price for %s: %v\n", investment.Symbol, err)
				return
			}

			updates[investment.ID] = priceData.Price
		}()
	}

	return updates, nil
}

// fetchPriceFromAPI fetches price data from Yahoo Finance API.
// It uses the Yahoo Finance client which includes built-in rate limiting.
func (s *marketDataService) fetchPriceFromAPI(ctx context.Context, symbol, currency string) (*models.MarketData, error) {
	// Create Yahoo Finance client
	client := yahoo.NewClient(symbol)

	// Add defensive programming to handle client initialization issues
	if client == nil {
		return nil, fmt.Errorf("failed to initialize Yahoo Finance client for %s", symbol)
	}

	// Fetch quote with timeout
	// The client's GetQuote method respects the global rate limiter
	quote, err := client.GetQuote(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch quote for %s: %w", symbol, err)
	}

	// Validate currency matches (if specified)
	if currency != "" && quote.Currency != currency {
		return nil, fmt.Errorf("currency mismatch for %s: expected %s, got %s", symbol, currency, quote.Currency)
	}

	// Convert to MarketData model
	return &models.MarketData{
		Symbol:    quote.Symbol,
		Currency:  quote.Currency,
		Price:     quote.Price,     // Already in cents
		Change24h: quote.Change24h, // Percentage
		Volume24h: quote.Volume24h, // Raw volume
		Timestamp: time.Now(),
	}, nil
}
