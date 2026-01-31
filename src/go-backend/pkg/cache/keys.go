package cache

import "fmt"

const (
	// Investment value cache keys
	CacheKeyInvestmentValue = "wallet:%d:investment_value" // Cache key format: wallet:{walletID}:investment_value
	InvestmentValueCacheTTL = 5 * 60                       // 5-minute TTL for investment value cache (in seconds)
)

// GetInvestmentValueCacheKey returns the Redis cache key for wallet investment value
func GetInvestmentValueCacheKey(walletID int32) string {
	return fmt.Sprintf(CacheKeyInvestmentValue, walletID)
}
