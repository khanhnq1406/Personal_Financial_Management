package service

import (
	"context"
	"fmt"
	"time"

	"wealthjourney/domain/models"
	"wealthjourney/domain/repository"
	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/validator"

	"gorm.io/gorm"
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
		if err == nil && cached != nil {
			return cached, nil
		}
		return nil, err
	}

	// Store in cache
	priceData.Timestamp = time.Now()
	if cached != nil && cached.ID > 0 {
		priceData.ID = cached.ID
		if err := s.marketDataRepo.Update(ctx, priceData); err != nil {
			// Log error but don't fail the request
			fmt.Printf("Warning: failed to update cached market data: %v\n", err)
		}
	} else {
		if err := s.marketDataRepo.Create(ctx, priceData); err != nil {
			// Log error but don't fail the request
			fmt.Printf("Warning: failed to cache market data: %v\n", err)
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
		// Get price for this investment
		priceData, err := s.GetPrice(ctx, investment.Symbol, investment.Currency, maxAge)
		if err != nil {
			// Log error but continue with other investments
			fmt.Printf("Warning: failed to get price for %s: %v\n", investment.Symbol, err)
			continue
		}

		updates[investment.ID] = priceData.Price
	}

	return updates, nil
}

// fetchPriceFromAPI fetches price data from an external API.
// This is a mock implementation that should be replaced with actual API calls.
func (s *marketDataService) fetchPriceFromAPI(ctx context.Context, symbol, currency string) (*models.MarketData, error) {
	// TODO: Implement actual API integration
	// For now, return a mock response

	// Mock implementation - in production, integrate with real APIs like:
	// - Alpha Vantage (stocks)
	// - CoinGecko (crypto)
	// - IEX Cloud
	// - Yahoo Finance

	// Simulate API delay
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case <-time.After(100 * time.Millisecond):
	}

	// Return mock data
	// In production, make actual HTTP request to external API
	mockPrice := int64(50000 * 100) // $50,000 in cents
	if currency == "VND" {
		mockPrice = int64(50000 * 100000) // 50,000 VND
	}

	return &models.MarketData{
		Symbol:    symbol,
		Currency:  currency,
		Price:     mockPrice,
		Change24h: 2.5,  // Mock 2.5% change
		Volume24h: 1000000,
		Timestamp: time.Now(),
	}, nil
}
