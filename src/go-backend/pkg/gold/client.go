package gold

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	// DefaultTimeout is the default timeout for API requests
	DefaultTimeout = 10 * time.Second
	// BaseURL is the base URL for vang.today API
	BaseURL = "https://www.vang.today/api/prices"
)

// Client represents the vang.today API client
type Client struct {
	httpClient *http.Client
	baseURL    string
}

// NewClient creates a new gold price client
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

// GoldPriceResponse represents the vang.today API response
type GoldPriceResponse struct {
	Success     bool        `json:"success"`
	CurrentTime int64       `json:"current_time"`
	Data        []GoldPrice  `json:"data"`
}

// GoldPrice represents a single gold type price
type GoldPrice struct {
	TypeCode   string `json:"type_code"`    // e.g., "SJL1L10", "XAU"
	Buy        int64  `json:"buy"`           // Buy price in VND/USD (smallest unit)
	Sell       int64  `json:"sell"`          // Sell price
	ChangeBuy  int64  `json:"change_buy"`    // Change from previous
	ChangeSell int64  `json:"change_sell"`   // Change from previous
	UpdateTime int64  `json:"update_time"`   // Unix timestamp
}

// FetchPrices fetches all gold prices from vang.today
func (c *Client) FetchPrices(ctx context.Context) (*GoldPriceResponse, error) {
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

	var result GoldPriceResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parse response: %w", err)
	}

	return &result, nil
}

// FetchPriceByType fetches price for a specific gold type
func (c *Client) FetchPriceByType(ctx context.Context, typeCode string) (*GoldPrice, error) {
	url := fmt.Sprintf("%s?type=%s", c.baseURL, typeCode)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetch price: %w", err)
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

	var result GoldPriceResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parse response: %w", err)
	}

	if !result.Success || len(result.Data) == 0 {
		return nil, fmt.Errorf("no data found for type: %s", typeCode)
	}

	return &result.Data[0], nil
}
