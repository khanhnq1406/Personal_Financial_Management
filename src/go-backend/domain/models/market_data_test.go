package models_test

import (
	"testing"
	"time"

	"wealthjourney/domain/models"
)

func TestMarketData_TableName(t *testing.T) {
	md := &models.MarketData{}
	if md.TableName() != "market_data" {
		t.Errorf("Expected table name 'market_data', got '%s'", md.TableName())
	}
}

func TestMarketData_IsExpired(t *testing.T) {
	tests := []struct {
		name     string
		marketData *models.MarketData
		maxAge   time.Duration
		expected bool
	}{
		{
			name: "data is expired",
			marketData: &models.MarketData{
				Symbol:    "BTC",
				Price:     60000000000,
				Timestamp: time.Now().Add(-6 * time.Minute),
			},
			maxAge:   5 * time.Minute,
			expected: true,
		},
		{
			name: "data is not expired",
			marketData: &models.MarketData{
				Symbol:    "BTC",
				Price:     60000000000,
				Timestamp: time.Now().Add(-3 * time.Minute),
			},
			maxAge:   5 * time.Minute,
			expected: false,
		},
		{
			name: "data is exactly at max age (expired)",
			marketData: &models.MarketData{
				Symbol:    "BTC",
				Price:     60000000000,
				Timestamp: time.Now().Add(-5 * time.Minute),
			},
			maxAge:   5 * time.Minute,
			expected: true,
		},
		{
			name: "data is in future (not expired)",
			marketData: &models.MarketData{
				Symbol:    "BTC",
				Price:     60000000000,
				Timestamp: time.Now().Add(1 * time.Minute),
			},
			maxAge:   5 * time.Minute,
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.marketData.IsExpired(tt.maxAge)
			if result != tt.expected {
				t.Errorf("IsExpired() = %v, expected %v", result, tt.expected)
			}
		})
	}
}
