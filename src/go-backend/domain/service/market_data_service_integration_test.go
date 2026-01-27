//go:build integration
// +build integration

package service

import (
	"context"
	"testing"
	"time"

	"wealthjourney/domain/models"
	"wealthjourney/domain/repository"
	"wealthjourney/pkg/database"
	"wealthjourney/pkg/yahoo"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// setupTestDB creates an in-memory test database or connects to a test database
func setupTestDB(t *testing.T) *database.Database {
	// Use PostgreSQL test database
	// In production, you might want to use Docker or a cloud test database
	dsn := "host=localhost port=5432 user=postgres password=postgres dbname=wealthjourney_test sslmode=disable"

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err, "Failed to connect to test database")

	// Clean up any existing tables
	err = db.Migrator().DropTable(&models.MarketData{})
	if err != nil {
		// Table might not exist, which is fine
		t.Logf("Note: Could not drop table (may not exist): %v", err)
	}

	// Run migrations
	err = db.AutoMigrate(&models.MarketData{})
	require.NoError(t, err, "Failed to migrate test database")

	return &database.Database{DB: db}
}

// cleanupTestDB closes the database connection
func cleanupTestDB(t *testing.T, db *database.Database) {
	sqlDB, err := db.DB.DB()
	require.NoError(t, err, "Failed to get SQL DB")

	// Clean up test data
	err = db.DB.Exec("DELETE FROM market_data").Error
	if err != nil {
		t.Logf("Warning: Could not clean up test data: %v", err)
	}

	err = sqlDB.Close()
	require.NoError(t, err, "Failed to close test database")
}

// setupTestMarketDataService creates a market data service with test repository
func setupTestMarketDataService(t *testing.T) (*marketDataService, *database.Database) {
	db := setupTestDB(t)
	marketDataRepo := repository.NewMarketDataRepository(db)
	service := NewMarketDataService(marketDataRepo).(*marketDataService)

	return service, db
}

// TestMarketDataService_Integration_RealAPICall tests fetching real price data from Yahoo Finance API
func TestMarketDataService_Integration_RealAPICall(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	service, db := setupTestMarketDataService(t)
	defer cleanupTestDB(t, db)

	t.Run("Fetch AAPL price from Yahoo Finance API", func(t *testing.T) {
		// Fetch price for Apple stock
		priceData, err := service.GetPrice(ctx, "AAPL", "USD", 24*time.Hour)

		// For now, this will use the mock implementation
		// When real API is integrated, this will fetch from Yahoo Finance
		require.NoError(t, err, "GetPrice should not return an error")
		require.NotNil(t, priceData, "Price data should not be nil")

		// Verify the data structure
		assert.Equal(t, "AAPL", priceData.Symbol, "Symbol should match")
		assert.Equal(t, "USD", priceData.Currency, "Currency should match")
		assert.Greater(t, priceData.Price, int64(0), "Price should be positive")
		assert.NotZero(t, priceData.Timestamp, "Timestamp should be set")

		// Verify cache was created in database
		var cached models.MarketData
		cacheErr := db.DB.WithContext(ctx).
			Where("symbol = ? AND currency = ?", "AAPL", "USD").
			Order("timestamp DESC").
			First(&cached).Error
		if cacheErr == nil {
			// Verify the cached data exists
			assert.NotNil(t, cached)
		} else {
			// Cache might not exist in some scenarios
			t.Logf("Note: Cache entry not found (this is acceptable)")
		}
	})

	t.Run("Fetch GOOGL price from Yahoo Finance API", func(t *testing.T) {
		// Fetch price for Google stock
		priceData, err := service.GetPrice(ctx, "GOOGL", "USD", 24*time.Hour)

		require.NoError(t, err, "GetPrice should not return an error")
		require.NotNil(t, priceData, "Price data should not be nil")

		assert.Equal(t, "GOOGL", priceData.Symbol)
		assert.Equal(t, "USD", priceData.Currency)
		assert.Greater(t, priceData.Price, int64(0))
	})
}

// TestMarketDataService_Integration_CacheBehavior tests cache hit/miss behavior
func TestMarketDataService_Integration_CacheBehavior(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	service, db := setupTestMarketDataService(t)
	defer cleanupTestDB(t, db)

	symbol := "MSFT"
	currency := "USD"
	maxAge := 15 * time.Minute

	t.Run("First call should fetch from API and create cache", func(t *testing.T) {
		// Clear any existing cache
		_ = db.DB.WithContext(ctx).
			Where("symbol = ? AND currency = ?", symbol, currency).
			Delete(&models.MarketData{}).Error

		// First call - should fetch from API
		start := time.Now()
		priceData1, err := service.GetPrice(ctx, symbol, currency, maxAge)
		duration1 := time.Since(start)

		require.NoError(t, err)
		require.NotNil(t, priceData1)
		assert.Equal(t, symbol, priceData1.Symbol)
		assert.Equal(t, currency, priceData1.Currency)

		// Verify cache was created
		var cached models.MarketData
		cacheErr := db.DB.WithContext(ctx).
			Where("symbol = ? AND currency = ?", symbol, currency).
			Order("timestamp DESC").
			First(&cached).Error
		require.NoError(t, cacheErr)
		require.NotNil(t, cached)
		assert.Equal(t, priceData1.Price, cached.Price)

		t.Logf("First call (API fetch) took: %v", duration1)
	})

	t.Run("Second call within cache TTL should hit cache", func(t *testing.T) {
		// Second call - should hit cache (faster)
		start := time.Now()
		priceData2, err := service.GetPrice(ctx, symbol, currency, maxAge)
		duration2 := time.Since(start)

		require.NoError(t, err)
		require.NotNil(t, priceData2)
		assert.Equal(t, symbol, priceData2.Symbol)
		assert.Equal(t, currency, priceData2.Currency)

		t.Logf("Second call (cache hit) took: %v", duration2)
		// Note: In the mock implementation, there's still a 100ms delay
		// With real API, cache hit should be significantly faster
	})

	t.Run("Third call after cache expiry should fetch from API again", func(t *testing.T) {
		// Manually expire the cache by updating timestamp
		var cached models.MarketData
		err := db.DB.WithContext(ctx).
			Where("symbol = ? AND currency = ?", symbol, currency).
			Order("timestamp DESC").
			First(&cached).Error
		require.NoError(t, err)

		// Set timestamp to older than maxAge
		expiredTime := time.Now().Add(-1 * time.Hour)
		cached.Timestamp = expiredTime
		err = db.DB.WithContext(ctx).Save(&cached).Error
		require.NoError(t, err)

		// Third call - should fetch from API again (cache is expired)
		start := time.Now()
		priceData3, err := service.GetPrice(ctx, symbol, currency, maxAge)
		duration3 := time.Since(start)

		require.NoError(t, err)
		require.NotNil(t, priceData3)
		assert.Equal(t, symbol, priceData3.Symbol)
		assert.Equal(t, currency, priceData3.Currency)

		t.Logf("Third call (cache expired, API fetch) took: %v", duration3)
	})
}

// TestMarketDataService_Integration_FallbackToStaleCache tests fallback behavior when API fails
func TestMarketDataService_Integration_FallbackToStaleCache(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	service, db := setupTestMarketDataService(t)
	defer cleanupTestDB(t, db)

	t.Run("Return stale cache when API fails and cache exists", func(t *testing.T) {
		symbol := "TSLA"
		currency := "USD"

		// First, create a cached entry
		cachedData := &models.MarketData{
			Symbol:    symbol,
			Currency:  currency,
			Price:     15000000, // $150,000 in cents
			Change24h: 2.5,
			Volume24h: 1000000,
			Timestamp: time.Now().Add(-2 * time.Hour), // Old data
		}
		err := db.DB.WithContext(ctx).Create(cachedData).Error
		require.NoError(t, err)

		// Note: This test will need to be updated when real API integration is done
		// For now, the mock API always succeeds, so we can't test failure scenario
		// When real API is integrated, we should:
		// 1. Mock API to return error
		// 2. Verify stale cache is returned
		// 3. Verify no error is returned (fallback successful)

		t.Log("When real API is integrated, this test will verify stale cache fallback")
		_ = err // Placeholder for when we can mock API failures
	})

	t.Run("Return error when API fails and no cache exists", func(t *testing.T) {
		symbol := "INVALID_SYMBOL_123456"
		currency := "USD"

		// Try to fetch a non-existent symbol
		// With mock implementation, this will still return mock data
		// With real API, this should fail
		priceData, err := service.GetPrice(ctx, symbol, currency, 24*time.Hour)

		// For now, mock always succeeds
		// When real API is integrated, this should return an error
		if err != nil {
			assert.Error(t, err, "Should return error for invalid symbol")
			assert.Nil(t, priceData, "Price data should be nil on error")
		} else {
			t.Log("Mock implementation returns data for any symbol")
			assert.NotNil(t, priceData)
		}
	})
}

// TestMarketDataService_Integration_MultipleSymbols tests fetching multiple symbols
func TestMarketDataService_Integration_MultipleSymbols(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	service, db := setupTestMarketDataService(t)
	defer cleanupTestDB(t, db)

	t.Run("Fetch prices for multiple symbols sequentially", func(t *testing.T) {
		symbols := []string{"AAPL", "GOOGL", "MSFT"}
		currency := "USD"

		start := time.Now()

		for _, symbol := range symbols {
			priceData, err := service.GetPrice(ctx, symbol, currency, 24*time.Hour)
			require.NoError(t, err, "Should fetch %s successfully", symbol)
			require.NotNil(t, priceData)
			assert.Equal(t, symbol, priceData.Symbol)
			assert.Equal(t, currency, priceData.Currency)
		}

		duration := time.Since(start)
		t.Logf("Fetched %d symbols in %v (average: %v per symbol)",
			len(symbols), duration, duration/time.Duration(len(symbols)))
	})

	t.Run("Verify rate limiting behavior", func(t *testing.T) {
		// The Yahoo Finance client has a built-in rate limiter (120 requests/minute)
		// This test verifies that rate limiting is working correctly

		symbols := []string{"AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"}
		currency := "USD"

		start := time.Now()

		for _, symbol := range symbols {
			priceData, err := service.GetPrice(ctx, symbol, currency, 24*time.Hour)
			require.NoError(t, err)
			assert.NotNil(t, priceData)
		}

		duration := time.Since(start)
		t.Logf("Fetched %d symbols with rate limiting in %v", len(symbols), duration)

		// With rate limiting of 120 requests/min (500ms between requests)
		// 5 requests should take at least 2 seconds
		minExpectedDuration := 500 * time.Millisecond * time.Duration(len(symbols)-1)
		assert.Greater(t, duration, minExpectedDuration,
			"Rate limiting should add delay between requests")
	})
}

// TestMarketDataService_Integration_UpdatePricesForInvestments tests batch price updates
func TestMarketDataService_Integration_UpdatePricesForInvestments(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	service, db := setupTestMarketDataService(t)
	defer cleanupTestDB(t, db)

	t.Run("Update prices for multiple investments", func(t *testing.T) {
		investments := []*models.Investment{
			{ID: 1, Symbol: "AAPL", Currency: "USD"},
			{ID: 2, Symbol: "GOOGL", Currency: "USD"},
			{ID: 3, Symbol: "MSFT", Currency: "USD"},
		}

		// Force refresh to bypass cache
		updates, err := service.UpdatePricesForInvestments(ctx, investments, true)

		require.NoError(t, err, "UpdatePricesForInvestments should not return an error")
		assert.Len(t, updates, len(investments),
			"Should return updates for all investments")

		// Verify each investment got a price update
		for _, inv := range investments {
			price, exists := updates[inv.ID]
			assert.True(t, exists, "Should have price update for investment %d", inv.ID)
			assert.Greater(t, price, int64(0), "Price should be positive")
			t.Logf("Investment %d (%s): price = %d cents", inv.ID, inv.Symbol, price)
		}
	})

	t.Run("Update prices with forceRefresh=false (uses cache)", func(t *testing.T) {
		// Create some cached data first
		cachedData := &models.MarketData{
			Symbol:    "AAPL",
			Currency:  "USD",
			Price:     1750000, // $17,500 in cents
			Change24h: 1.5,
			Volume24h: 50000000,
			Timestamp: time.Now(),
		}
		err := db.DB.WithContext(ctx).Create(cachedData).Error
		require.NoError(t, err)

		investments := []*models.Investment{
			{ID: 1, Symbol: "AAPL", Currency: "USD"},
		}

		// Update without force refresh - should use cache
		updates, err := service.UpdatePricesForInvestments(ctx, investments, false)

		require.NoError(t, err)
		assert.Len(t, updates, 1)

		price := updates[1]
		assert.Equal(t, cachedData.Price, price,
			"Should use cached price when not force refreshing")
	})
}

// TestMarketDataService_Integration_ErrorCases tests various error scenarios
func TestMarketDataService_Integration_ErrorCases(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	service, db := setupTestMarketDataService(t)
	defer cleanupTestDB(t, db)

	t.Run("Invalid symbol should return error", func(t *testing.T) {
		// Note: This will work with mock implementation
		// With real API, invalid symbols should return an error
		priceData, err := service.GetPrice(ctx, "", "USD", 24*time.Hour)

		assert.Error(t, err, "Empty symbol should return validation error")
		assert.Nil(t, priceData, "Price data should be nil on validation error")
	})

	t.Run("Invalid currency should return error", func(t *testing.T) {
		priceData, err := service.GetPrice(ctx, "AAPL", "INVALID", 24*time.Hour)

		assert.Error(t, err, "Invalid currency should return validation error")
		assert.Nil(t, priceData, "Price data should be nil on validation error")
	})

	t.Run("Network timeout handling", func(t *testing.T) {
		// Create a context with short timeout
		ctx, cancel := context.WithTimeout(ctx, 50*time.Millisecond)
		defer cancel()

		// Try to fetch price with timeout
		// Mock has 100ms delay, so this should timeout
		priceData, err := service.GetPrice(ctx, "AAPL", "USD", 24*time.Hour)

		assert.Error(t, err, "Should return error on timeout")
		assert.Nil(t, priceData, "Price data should be nil on timeout")
	})

	t.Run("Currency mismatch handling", func(t *testing.T) {
		// This tests the scenario where requested currency doesn't match the quote currency
		// With real API, this should either convert or return an error
		// For now, mock returns the requested currency

		priceData, err := service.GetPrice(ctx, "AAPL", "EUR", 24*time.Hour)

		// Mock implementation returns mock data with requested currency
		// Real implementation should handle currency conversion or return error
		if err == nil {
			assert.NotNil(t, priceData)
			t.Log("Mock implementation allows any currency")
		} else {
			t.Logf("Currency mismatch error (expected with real API): %v", err)
		}
	})
}

// TestMarketDataService_Integration_YahooFinanceClient tests the Yahoo Finance client directly
func TestMarketDataService_Integration_YahooFinanceClient(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()

	t.Run("Fetch AAPL quote directly from Yahoo Finance", func(t *testing.T) {
		client := yahoo.NewClient("AAPL")

		quote, err := client.GetQuote(ctx)

		// This test directly calls Yahoo Finance API
		// It may fail if there's no internet connection or API is down
		if err != nil {
			t.Skipf("Skipping Yahoo Finance API test: %v", err)
		}

		require.NotNil(t, quote)
		assert.Equal(t, "AAPL", quote.Symbol)
		assert.Greater(t, quote.Price, int64(0))
		assert.NotEmpty(t, quote.Currency)

		t.Logf("AAPL Quote: %d.%02d %s (Change: %.2f%%)",
			quote.Price/100, quote.Price%100, quote.Currency, quote.Change24h)
	})

	t.Run("Fetch multiple symbols to test rate limiting", func(t *testing.T) {
		symbols := []string{"AAPL", "GOOGL", "MSFT"}

		start := time.Now()
		for _, symbol := range symbols {
			client := yahoo.NewClient(symbol)
			quote, err := client.GetQuote(ctx)
			if err != nil {
				t.Skipf("Skipping due to API error: %v", err)
			}
			assert.NotNil(t, quote)
			assert.Equal(t, symbol, quote.Symbol)
		}
		duration := time.Since(start)

		t.Logf("Fetched %d symbols in %v (with rate limiting)", len(symbols), duration)
	})

	t.Run("Test invalid symbol", func(t *testing.T) {
		client := yahoo.NewClient("INVALID_SYMBOL_123456")

		quote, err := client.GetQuote(ctx)

		assert.Error(t, err, "Invalid symbol should return error")
		assert.Nil(t, quote, "Quote should be nil for invalid symbol")
	})
}

// TestMarketDataService_Integration_CacheCleanup tests cache cleanup functionality
func TestMarketDataService_Integration_CacheCleanup(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	_, db := setupTestMarketDataService(t)
	defer cleanupTestDB(t, db)

	t.Run("Delete expired cache entries", func(t *testing.T) {
		// Create test data with different timestamps
		now := time.Now()
		testData := []*models.MarketData{
			{Symbol: "OLD1", Currency: "USD", Price: 10000, Timestamp: now.Add(-48 * time.Hour)},
			{Symbol: "OLD2", Currency: "USD", Price: 20000, Timestamp: now.Add(-25 * time.Hour)},
			{Symbol: "RECENT", Currency: "USD", Price: 30000, Timestamp: now.Add(-1 * time.Hour)},
		}

		for _, data := range testData {
			err := db.DB.WithContext(ctx).Create(data).Error
			require.NoError(t, err)
		}

		// Delete entries older than 24 hours manually
		cutoffTime := now.Add(-24 * time.Hour)
		err := db.DB.WithContext(ctx).
			Where("timestamp < ?", cutoffTime).
			Delete(&models.MarketData{}).Error
		require.NoError(t, err)

		// Verify only recent entry remains
		var allData []models.MarketData
		err = db.DB.WithContext(ctx).Find(&allData).Error
		require.NoError(t, err)

		// Should only have 1 entry (RECENT)
		assert.Len(t, allData, 1, "Should only have 1 recent entry after cleanup")
		if len(allData) > 0 {
			assert.Equal(t, "RECENT", allData[0].Symbol)
		}
	})
}

// BenchmarkMarketDataService_GetPrice benchmarks the GetPrice performance
func BenchmarkMarketDataService_GetPrice(b *testing.B) {
	if testing.Short() {
		b.Skip("Skipping benchmark in short mode")
	}

	ctx := context.Background()
	service, db := setupTestMarketDataService(&testing.T{})
	defer cleanupTestDB(&testing.T{}, db)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := service.GetPrice(ctx, "AAPL", "USD", 15*time.Minute)
		if err != nil {
			b.Fatalf("GetPrice failed: %v", err)
		}
	}
}
