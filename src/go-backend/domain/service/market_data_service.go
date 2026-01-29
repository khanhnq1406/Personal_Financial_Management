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

	// SearchSymbols searches for investment symbols by query.
	SearchSymbols(ctx context.Context, query string, limit int) ([]yahoo.SearchResult, error)

	// GetPriceBatch fetches prices for multiple symbols in a single API call.
	GetPriceBatch(ctx context.Context, symbols []string) (map[string]*models.MarketData, error)
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
// Uses the v8 chart API which provides comprehensive market data.
func (s *marketDataService) fetchPriceFromAPI(ctx context.Context, symbol, currency string) (*models.MarketData, error) {
	// Use GetQuote function for comprehensive data
	quote, err := yahoo.GetQuote(ctx, symbol)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch quote for %s: %w", symbol, err)
	}

	// Use quote's currency if available, otherwise fall back to investment's currency
	fetchedCurrency := quote.Currency
	if fetchedCurrency == "" {
		fetchedCurrency = currency
	}

	// Convert price from float to int64 (smallest currency unit)
	// Uses currency-based decimal places: VND has 0, USD has 2, etc.
	// For VND: 69800.00 -> 69800 (no decimal places)
	// For USD: 150.25 -> 15025 (2 decimal places)
	priceInSmallestUnit := yahoo.ToSmallestCurrencyUnitByCurrency(quote.RegularMarketPrice, fetchedCurrency)

	return &models.MarketData{
		Symbol:    quote.Symbol,
		Currency:  fetchedCurrency,
		Price:     priceInSmallestUnit,
		Change24h: quote.RegularMarketChangePercent,
		Volume24h: 0,
		Timestamp: time.Now(),
	}, nil
}

// SearchSymbols searches for investment symbols by query.
func (s *marketDataService) SearchSymbols(ctx context.Context, query string, limit int) ([]yahoo.SearchResult, error) {
	return yahoo.SearchSymbols(ctx, query, limit)
}

// GetPriceBatch fetches prices for multiple symbols in a single API call.
// Returns a map of symbol to MarketData.
func (s *marketDataService) GetPriceBatch(ctx context.Context, symbols []string) (map[string]*models.MarketData, error) {
	if len(symbols) == 0 {
		return nil, apperrors.NewValidationError("symbols list cannot be empty")
	}

	// Use batch quote API
	quotes, err := yahoo.GetQuoteBatch(ctx, symbols)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch batch quotes: %w", err)
	}

	// Convert to MarketData
	results := make(map[string]*models.MarketData)
	for _, quote := range quotes {
		priceInSmallestUnit := yahoo.ToSmallestCurrencyUnitByCurrency(quote.RegularMarketPrice, quote.Currency)
		results[quote.Symbol] = &models.MarketData{
			Symbol:    quote.Symbol,
			Currency:  quote.Currency,
			Price:     priceInSmallestUnit,
			Change24h: quote.RegularMarketChangePercent,
			Volume24h: 0,
			Timestamp: time.Now(),
		}
	}

	return results, nil
}
