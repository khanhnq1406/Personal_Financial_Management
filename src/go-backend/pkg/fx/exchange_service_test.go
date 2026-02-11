package fx

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"wealthjourney/domain/models"
	"wealthjourney/pkg/config"
)

// MockExchangeRateRepository is a mock implementation of ExchangeRateRepository
type MockExchangeRateRepository struct {
	mock.Mock
}

func (m *MockExchangeRateRepository) GetRate(ctx context.Context, fromCurrency, toCurrency string, date time.Time) (*models.ExchangeRate, error) {
	args := m.Called(ctx, fromCurrency, toCurrency, date)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ExchangeRate), args.Error(1)
}

func (m *MockExchangeRateRepository) SaveRate(ctx context.Context, rate *models.ExchangeRate) error {
	args := m.Called(ctx, rate)
	return args.Error(0)
}

func (m *MockExchangeRateRepository) ListRates(ctx context.Context, fromCurrency, toCurrency string, startDate, endDate time.Time) ([]*models.ExchangeRate, error) {
	args := m.Called(ctx, fromCurrency, toCurrency, startDate, endDate)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.ExchangeRate), args.Error(1)
}

func (m *MockExchangeRateRepository) GetLatestRate(ctx context.Context, fromCurrency, toCurrency string) (*models.ExchangeRate, error) {
	args := m.Called(ctx, fromCurrency, toCurrency)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ExchangeRate), args.Error(1)
}

func TestGetLatestRate_SameCurrency(t *testing.T) {
	// Setup
	cfg := config.FX{
		Enabled:            true,
		APIBaseURL:         "https://api.exchangerate-api.com/v4",
		Timeout:            10 * time.Second,
		HistoricalCacheTTL: 168 * time.Hour,
		LatestCacheTTL:     1 * time.Hour,
		FallbackToLatest:   true,
		MaxRetries:         3,
	}

	mockRepo := new(MockExchangeRateRepository)
	svc := NewExchangeService(cfg, mockRepo, nil)

	// Test
	rate, err := svc.GetLatestRate(context.Background(), "VND", "VND")

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, 1.0, rate)
}

func TestConvert_SameCurrency(t *testing.T) {
	// Setup
	cfg := config.FX{
		Enabled:            true,
		APIBaseURL:         "https://api.exchangerate-api.com/v4",
		Timeout:            10 * time.Second,
		HistoricalCacheTTL: 168 * time.Hour,
		LatestCacheTTL:     1 * time.Hour,
		FallbackToLatest:   true,
		MaxRetries:         3,
	}

	mockRepo := new(MockExchangeRateRepository)
	svc := NewExchangeService(cfg, mockRepo, nil)

	// Test
	amount := int64(100000) // 1000 VND
	convertedAmount, rate, err := svc.Convert(context.Background(), amount, "VND", "VND", time.Now())

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, 1.0, rate)
	assert.Equal(t, amount, convertedAmount)
}

func TestGetLatestRate_Disabled(t *testing.T) {
	// Setup
	cfg := config.FX{
		Enabled: false,
	}

	mockRepo := new(MockExchangeRateRepository)
	svc := NewExchangeService(cfg, mockRepo, nil)

	// Test
	_, err := svc.GetLatestRate(context.Background(), "USD", "VND")

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "disabled")
}
