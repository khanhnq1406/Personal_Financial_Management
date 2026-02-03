package silver

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
)

const (
	DefaultTimeout = 10 * time.Second
	BaseURL        = "https://giabac.ancarat.com/api/price-data"
)

type Client struct {
	httpClient *http.Client
	baseURL    string
}

func NewClient(timeout time.Duration) *Client {
	if timeout <= 0 {
		timeout = DefaultTimeout
	}

	return &Client{
		httpClient: &http.Client{
			Timeout: timeout,
		},
		baseURL: BaseURL,
	}
}

// SilverPrice represents a single silver type price
type SilverPrice struct {
	TypeCode string  // "A4" (1 lượng), "K4" (1 Kilo)
	Name     string  // "Ngân Long Quảng Tiến 999 - 1 lượng"
	Buy      float64 // Buy price in VND
	Sell     float64 // Sell price in VND
	Currency string  // "VND"
}

// FetchPrices fetches all silver prices from ancarat API
func (c *Client) FetchPrices(ctx context.Context) (map[string]SilverPrice, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", c.baseURL, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetch prices: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("unexpected status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	// Parse JSON array response
	var result [][]string
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parse response: %w", err)
	}

	// Extract silver prices (filter for A4 and K4)
	prices := make(map[string]SilverPrice)

	for _, row := range result {
		if len(row) < 4 {
			continue
		}

		name := row[0]
		buyStr := row[1]
		sellStr := row[2]
		typeCode := row[3]

		// Filter for supported types
		if typeCode != "A4" && typeCode != "K4" {
			continue
		}

		// Parse prices (remove commas)
		buyStr = strings.ReplaceAll(buyStr, ",", "")
		sellStr = strings.ReplaceAll(sellStr, ",", "")

		buy, _ := strconv.ParseFloat(buyStr, 64)
		sell, _ := strconv.ParseFloat(sellStr, 64)

		prices[typeCode] = SilverPrice{
			TypeCode: typeCode,
			Name:     name,
			Buy:      buy,
			Sell:     sell,
			Currency: "VND",
		}
	}

	return prices, nil
}

// FetchPriceByType fetches price for specific silver type
func (c *Client) FetchPriceByType(ctx context.Context, typeCode string) (*SilverPrice, error) {
	prices, err := c.FetchPrices(ctx)
	if err != nil {
		return nil, err
	}

	price, ok := prices[typeCode]
	if !ok {
		return nil, fmt.Errorf("no data found for type: %s", typeCode)
	}

	return &price, nil
}
