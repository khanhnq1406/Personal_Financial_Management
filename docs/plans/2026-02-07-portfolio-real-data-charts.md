# Portfolio Real Data Charts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all mock data in portfolio page charts with real data from backend APIs, including historical values for sparklines and proper asset allocation breakdown with best performer calculation.

**Architecture:**
- Extend existing protobuf API to include historical portfolio values and top/worst performers
- Add new database table for historical portfolio snapshots
- Create backend service to compute and cache historical data
- Update frontend components to use real data instead of mock data
- Implement background job for periodic portfolio value snapshots

**Tech Stack:**
- Backend: Go 1.23, GORM, PostgreSQL
- Frontend: Next.js 15, React 19, TypeScript 5, Recharts
- API: Protocol Buffers (investment.proto)

---

## Overview

This plan implements real data for two main chart areas in the portfolio page:

1. **Total Value Sparkline** - Currently uses randomly generated mock data
2. **Asset Allocation Chart** - Currently uses mock data and mock "Best Performer"

Current state ([PortfolioSummaryEnhanced.tsx:162-208](src/wj-client/app/dashboard/portfolio/components/PortfolioSummaryEnhanced.tsx#L162-L208)):
- Sparkline: Generates 10 random data points based on current value
- Asset Allocation: Randomly distributes value across Stocks, Crypto, ETFs, Gold
- Best Performer: Hardcoded "+12.5%"

---

## Task 1: Design and Protobuf API Definition

**Files:**
- Modify: `api/protobuf/v1/investment.proto`

**Step 1: Add historical data messages to investment.proto**

Open `api/protobuf/v1/investment.proto` and add after the `PortfolioSummary` message (around line 108):

```protobuf
// HistoricalPortfolioValue represents a single portfolio value snapshot
message HistoricalPortfolioValue {
  int64 timestamp = 1 [json_name = "timestamp"];      // Unix timestamp when snapshot was taken
  int64 totalValue = 2 [json_name = "totalValue"];    // Total portfolio value in base currency
  wealthjourney.common.v1.Money displayTotalValue = 3 [json_name = "displayTotalValue"]; // Value in user's preferred currency
}

// InvestmentPerformance represents top/worst performing investments
message InvestmentPerformance {
  int32 investmentId = 1 [json_name = "investmentId"];
  string symbol = 2 [json_name = "symbol"];
  string name = 3 [json_name = "name"];
  InvestmentType type = 4 [json_name = "type"];
  int64 unrealizedPnl = 5 [json_name = "unrealizedPnl"];
  double unrealizedPnlPercent = 6 [json_name = "unrealizedPnlPercent"];
  wealthjourney.common.v1.Money displayUnrealizedPnl = 7 [json_name = "displayUnrealizedPnl"];
  string displayCurrency = 8 [json_name = "displayCurrency"];
}

// GetHistoricalPortfolioValuesRequest for fetching historical data
message GetHistoricalPortfolioValuesRequest {
  int32 walletId = 1 [json_name = "walletId"];       // 0 or omitted = all investment wallets
  InvestmentType typeFilter = 2 [json_name = "typeFilter"]; // Optional filter by investment type
  int32 days = 3 [json_name = "days"];               // Number of days of history (default: 30, max: 365)
  int32 points = 4 [json_name = "points"];           // Number of data points to return (default: 10, max: 100)
}

// GetHistoricalPortfolioValuesResponse with historical portfolio values
message GetHistoricalPortfolioValuesResponse {
  bool success = 1 [json_name = "success"];
  string message = 2 [json_name = "message"];
  repeated HistoricalPortfolioValue data = 3 [json_name = "data"];
  string timestamp = 4 [json_name = "timestamp"];
}
```

**Step 2: Add RPC method to InvestmentService**

Add to the `InvestmentService` service definition (around line 161 in investment.proto):

```protobuf
  // GetHistoricalPortfolioValues returns historical portfolio value snapshots
  rpc GetHistoricalPortfolioValues(GetHistoricalPortfolioValuesRequest) returns (GetHistoricalPortfolioValuesResponse) {
    option (google.api.http) = {
      get: "/api/v1/portfolio/historical-values"
    };
  }
```

**Step 3: Extend PortfolioSummary message to include top performers**

Modify the existing `PortfolioSummary` message to add `topPerformers` and `worstPerformers` fields (after line 107):

```protobuf
message PortfolioSummary {
  // ... existing fields ...
  repeated InvestmentPerformance topPerformers = 16 [json_name = "topPerformers"]; // Top 3 performing investments
  repeated InvestmentPerformance worstPerformers = 17 [json_name = "worstPerformers"]; // Bottom 3 performing investments
}
```

**Step 4: Generate protobuf code**

Run: `task proto:all`
Expected: All Go and TypeScript code regenerated successfully
Output should show:
```
Generating protobuf code for backend...
Generating protobuf code for frontend...
Running frontend REST API generation...
Protobuf generation complete!
```

---

## Task 2: Backend Database Model for Historical Portfolio Values

**Files:**
- Create: `src/go-backend/domain/models/portfolio_history.go`

**Step 1: Write the model file**

Create the file with this content:

```go
package models

import (
	"time"

	"gorm.io/gorm"
)

// PortfolioHistory stores historical portfolio value snapshots
// Used for sparkline charts and historical performance tracking
type PortfolioHistory struct {
	ID            int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID        int32          `gorm:"not null;index:idx_user_wallet" json:"userId"`
	WalletID      int32          `gorm:"not null;index:idx_user_wallet;index:idx_wallet_timestamp" json:"walletId"`
	TotalValue    int64          `gorm:"type:bigint;not null" json:"totalValue"`
	TotalCost     int64          `gorm:"type:bigint;not null" json:"totalCost"`
	TotalPnl      int64          `gorm:"type:bigint;not null" json:"totalPnl"`
	Currency      string         `gorm:"size:3;not null" json:"currency"`
	Timestamp     time.Time      `gorm:"not null;index:idx_wallet_timestamp" json:"timestamp"`
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for PortfolioHistory
func (PortfolioHistory) TableName() string {
	return "portfolio_history"
}

// IsDuplicate checks if this entry is a duplicate (same user, wallet, and timestamp within 1 hour)
func (ph *PortfolioHistory) IsDuplicate(existing *PortfolioHistory) bool {
	if existing == nil {
		return false
	}
	if ph.UserID != existing.UserID || ph.WalletID != existing.WalletID {
		return false
	}
	timeDiff := ph.Timestamp.Sub(existing.Timestamp)
	return timeDiff.Abs() < time.Hour
}
```

---

## Task 3: Backend Repository Layer

**Files:**
- Create: `src/go-backend/domain/repository/portfolio_history_repository.go`
- Modify: `src/go-backend/domain/repository/interfaces.go`

**Step 1: Write the repository interface**

Create `src/go-backend/domain/repository/portfolio_history_repository.go`:

```go
package repository

import (
	"context"
	"time"

	"wealthjourney/domain/models"
)

// PortfolioHistoryRepository defines the interface for portfolio history data access
type PortfolioHistoryRepository interface {
	// Create stores a new portfolio history snapshot
	Create(ctx context.Context, history *models.PortfolioHistory) error

	// GetLatestByWallet retrieves the most recent snapshot for a wallet
	GetLatestByWallet(ctx context.Context, userID, walletID int32) (*models.PortfolioHistory, error)

	// GetHistoryByWallet retrieves historical snapshots within a time range
	GetHistoryByWallet(ctx context.Context, userID, walletID int32, from, to time.Time, limit int) ([]*models.PortfolioHistory, error)

	// GetAggregatedHistory retrieves aggregated history across all investment wallets
	GetAggregatedHistory(ctx context.Context, userID int32, from, to time.Time, limit int) ([]*models.PortfolioHistory, error)

	// DeleteOldRecords removes records older than specified duration (cleanup)
	DeleteOldRecords(ctx context.Context, olderThan time.Duration) error

	// CreateSnapshotIfNotDuplicate creates a snapshot only if one doesn't exist recently
	CreateSnapshotIfNotDuplicate(ctx context.Context, history *models.PortfolioHistory) (*models.PortfolioHistory, error)
}
```

**Step 2: Add to interfaces.go**

Add the import and interface to `src/go-backend/domain/repository/interfaces.go`:

```go
// Add to the imports section (around line 20)
type PortfolioHistoryRepository interface {
	repository.PortfolioHistoryRepository
}
```

---

## Task 4: Backend Repository Implementation

**Files:**
- Create: `src/go-backend/domain/repository/portfolio_history_repository_impl.go`

**Step 1: Write the repository implementation**

Create `src/go-backend/domain/repository/portfolio_history_repository_impl.go`:

```go
package repository

import (
	"context"
	"time"

	"gorm.io/gorm"
	"wealthjourney/domain/models"
)

type portfolioHistoryRepositoryImpl struct {
	db *gorm.DB
}

// NewPortfolioHistoryRepository creates a new PortfolioHistoryRepository
func NewPortfolioHistoryRepository(db *gorm.DB) PortfolioHistoryRepository {
	return &portfolioHistoryRepositoryImpl{db: db}
}

// Create stores a new portfolio history snapshot
func (r *portfolioHistoryRepositoryImpl) Create(ctx context.Context, history *models.PortfolioHistory) error {
	return r.db.WithContext(ctx).Create(history).Error
}

// GetLatestByWallet retrieves the most recent snapshot for a wallet
func (r *portfolioHistoryRepositoryImpl) GetLatestByWallet(ctx context.Context, userID, walletID int32) (*models.PortfolioHistory, error) {
	var history models.PortfolioHistory
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND wallet_id = ?", userID, walletID).
		Order("timestamp DESC").
		First(&history).Error
	if err != nil {
		return nil, err
	}
	return &history, nil
}

// GetHistoryByWallet retrieves historical snapshots within a time range
func (r *portfolioHistoryRepositoryImpl) GetHistoryByWallet(ctx context.Context, userID, walletID int32, from, to time.Time, limit int) ([]*models.PortfolioHistory, error) {
	var histories []*models.PortfolioHistory
	query := r.db.WithContext(ctx).
		Where("user_id = ? AND wallet_id = ?", userID, walletID).
		Where("timestamp >= ? AND timestamp <= ?", from, to).
		Order("timestamp ASC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&histories).Error
	return histories, err
}

// GetAggregatedHistory retrieves aggregated history across all investment wallets
// Returns daily aggregated snapshots
func (r *portfolioHistoryRepositoryImpl) GetAggregatedHistory(ctx context.Context, userID int32, from, to time.Time, limit int) ([]*models.PortfolioHistory, error) {
	// For now, we'll fetch all history and aggregate in memory
	// In production, consider using SQL aggregation for better performance
	var histories []*models.PortfolioHistory
	query := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Where("timestamp >= ? AND timestamp <= ?", from, to).
		Order("timestamp ASC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&histories).Error
	return histories, err
}

// DeleteOldRecords removes records older than specified duration
func (r *portfolioHistoryRepositoryImpl) DeleteOldRecords(ctx context.Context, olderThan time.Duration) error {
	cutoff := time.Now().Add(-olderThan)
	return r.db.WithContext(ctx).
		Where("timestamp < ?", cutoff).
		Delete(&models.PortfolioHistory{}).Error
}

// CreateSnapshotIfNotDuplicate creates a snapshot only if one doesn't exist recently
func (r *portfolioHistoryRepositoryImpl) CreateSnapshotIfNotDuplicate(ctx context.Context, history *models.PortfolioHistory) (*models.PortfolioHistory, error) {
	// Check for recent snapshot (within 1 hour)
	recent, err := r.GetLatestByWallet(ctx, history.UserID, history.WalletID)
	if err == nil && history.IsDuplicate(recent) {
		// Update the existing snapshot instead of creating a new one
		recent.TotalValue = history.TotalValue
		recent.TotalCost = history.TotalCost
		recent.TotalPnl = history.TotalPnl
		recent.Timestamp = history.Timestamp
		err := r.db.WithContext(ctx).Save(recent).Error
		return recent, err
	}

	// No recent snapshot, create new one
	err = r.Create(ctx, history)
	return history, err
}
```

---

## Task 5: Backend Service Layer - Historical Values

**Files:**
- Create: `src/go-backend/domain/service/portfolio_history_service.go`
- Modify: `src/go-backend/domain/service/interfaces.go`

**Step 1: Write the service interface and implementation**

Create `src/go-backend/domain/service/portfolio_history_service.go`:

```go
package service

import (
	"context"
	"fmt"
	"time"

	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/types"
	"wealthjourney/protobuf/v1"
)

// PortfolioHistoryService handles historical portfolio data
type PortfolioHistoryService interface {
	// GetHistoricalValues retrieves historical portfolio values for charts
	GetHistoricalValues(ctx context.Context, userID int32, req *protobufv1.GetHistoricalPortfolioValuesRequest) (*protobufv1.GetHistoricalPortfolioValuesResponse, error)

	// CreateSnapshot creates a portfolio value snapshot
	CreateSnapshot(ctx context.Context, userID, walletID int32) error

	// CreateAggregatedSnapshot creates snapshots for all investment wallets
	CreateAggregatedSnapshot(ctx context.Context, userID int32) error
}

type portfolioHistoryService struct {
	historyRepo   repository.PortfolioHistoryRepository
	investmentSvc InvestmentService
	userRepo      repository.UserRepository
	fxRateSvc     FXRateService
}

// NewPortfolioHistoryService creates a new PortfolioHistoryService
func NewPortfolioHistoryService(
	historyRepo repository.PortfolioHistoryRepository,
	investmentSvc InvestmentService,
	userRepo repository.UserRepository,
	fxRateSvc FXRateService,
) PortfolioHistoryService {
	return &portfolioHistoryService{
		historyRepo:   historyRepo,
		investmentSvc: investmentSvc,
		userRepo:      userRepo,
		fxRateSvc:     fxRateSvc,
	}
}

// GetHistoricalValues retrieves historical portfolio values for charts
func (s *portfolioHistoryService) GetHistoricalValues(ctx context.Context, userID int32, req *protobufv1.GetHistoricalPortfolioValuesRequest) (*protobufv1.GetHistoricalPortfolioValuesResponse, error) {
	// 1. Validate inputs
	if err := validateID(userID); err != nil {
		return nil, err
	}

	days := req.Days
	if days <= 0 || days > 365 {
		days = 30 // Default to 30 days
	}

	points := req.Points
	if points <= 0 || points > 100 {
		points = 10 // Default to 10 points
	}

	// 2. Get user's preferred currency
	user, err := s.userRepo.GetByID(ctx, userID)
	if user == nil {
		return nil, apperrors.NewNotFoundError("user")
	}
	userCurrency := user.PreferredCurrency

	// 3. Calculate time range
	to := time.Now()
	from := to.AddDate(0, 0, -int(days))

	// 4. Fetch historical data
	var histories []*models.PortfolioHistory

	if req.WalletId == 0 {
		// Aggregated across all investment wallets
		histories, err = s.historyRepo.GetAggregatedHistory(ctx, userID, from, to, points*4) // Get more points for sampling
		if err != nil {
			return nil, fmt.Errorf("failed to fetch historical data: %w", err)
		}
	} else {
		// Specific wallet
		histories, err = s.historyRepo.GetHistoryByWallet(ctx, userID, req.WalletId, from, to, points*4)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch historical data: %w", err)
		}
	}

	// 5. Sample the data to requested number of points
	sampled := s.sampleData(histories, points)

	// 6. Convert to protobuf format with currency conversion
	data := make([]*protobufv1.HistoricalPortfolioValue, len(sampled))
	for i, h := range sampled {
		displayValue := h.TotalValue
		displayCurrency := h.Currency

		// Convert to user's preferred currency if different
		if userCurrency != h.Currency {
			rate, err := s.fxRateSvc.GetRate(ctx, h.Currency, userCurrency)
			if err == nil && rate > 0 {
				displayValue = int64(float64(h.TotalValue) * rate)
				displayCurrency = userCurrency
			}
		}

		data[i] = &protobufv1.HistoricalPortfolioValue{
			Timestamp:  h.Timestamp.Unix(),
			TotalValue: h.TotalValue,
			DisplayTotalValue: &protobufv1.Money{
				Amount:   displayValue,
				Currency: displayCurrency,
			},
		}
	}

	return &protobufv1.GetHistoricalPortfolioValuesResponse{
		Success:   true,
		Message:   "Historical values retrieved successfully",
		Data:      data,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// sampleData reduces the dataset to the requested number of points using time-based sampling
func (s *portfolioHistoryService) sampleData(histories []*models.PortfolioHistory, points int) []*models.PortfolioHistory {
	if len(histories) <= points {
		return histories
	}

	// Calculate step size
	step := len(histories) / points
	if step < 1 {
		step = 1
	}

	// Sample at regular intervals
	result := make([]*models.PortfolioHistory, 0, points)
	for i := 0; i < len(histories) && len(result) < points; i += step {
		result = append(result, histories[i])
	}

	// Always include the latest data point
	if len(result) > 0 && result[len(result)-1] != histories[len(histories)-1] {
		result = append(result, histories[len(histories)-1])
	}

	return result
}

// CreateSnapshot creates a portfolio value snapshot for a specific wallet
func (s *portfolioHistoryService) CreateSnapshot(ctx context.Context, userID, walletID int32) error {
	// Get current portfolio summary for this wallet
	summary, err := s.investmentSvc.GetPortfolioSummary(ctx, userID, walletID)
	if err != nil {
		return fmt.Errorf("failed to get portfolio summary: %w", err)
	}

	if summary.Data == nil {
		return fmt.Errorf("no portfolio data available")
	}

	data := summary.Data

	// Create snapshot
	history := &models.PortfolioHistory{
		UserID:     userID,
		WalletID:   walletID,
		TotalValue: data.TotalValue,
		TotalCost:  data.TotalCost,
		TotalPnl:   data.TotalPnl,
		Currency:   data.Currency,
		Timestamp:  time.Now(),
	}

	_, err = s.historyRepo.CreateSnapshotIfNotDuplicate(ctx, history)
	return err
}

// CreateAggregatedSnapshot creates snapshots for all investment wallets
func (s *portfolioHistoryService) CreateAggregatedSnapshot(ctx context.Context, userID int32) error {
	// Get all investment wallets for the user
	wallets, err := s.investmentSvc.ListInvestmentWallets(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to list investment wallets: %w", err)
	}

	// Create snapshot for each wallet
	for _, wallet := range wallets {
		if err := s.CreateSnapshot(ctx, userID, wallet.ID); err != nil {
			// Log error but continue with other wallets
			fmt.Printf("Warning: failed to create snapshot for wallet %d: %v\n", wallet.ID, err)
		}
	}

	return nil
}
```

**Step 2: Add to interfaces.go**

Add to `src/go-backend/domain/service/interfaces.go`:

```go
// Add to the service interfaces section
type PortfolioHistoryService interface {
	service.PortfolioHistoryService
}
```

---

## Task 6: Extend InvestmentService to Include Top/Worst Performers

**Files:**
- Modify: `src/go-backend/domain/service/investment_service.go`

**Step 1: Read the current GetAggregatedPortfolioSummary implementation**

First, locate the GetAggregatedPortfolioSummary method in `investment_service.go`:

```bash
grep -n "GetAggregatedPortfolioSummary" src/go-backend/domain/service/investment_service.go
```

**Step 2: Modify GetAggregatedPortfolioSummary to include performers**

Update the method to calculate top and worst performers. Add this logic after calculating the summary data:

```go
// After calculating investmentsByType, add performer calculation
topPerformers, worstPerformers, err := s.calculatePerformers(ctx, userID, req.WalletId, req.TypeFilter)
if err != nil {
    // Log error but don't fail the request
    fmt.Printf("Warning: failed to calculate performers: %v\n", err)
}

// Add to response
summary.TopPerformers = topPerformers
summary.WorstPerformers = worstPerformers
```

**Step 3: Add the calculatePerformers helper method**

Add this new method to the investmentService:

```go
// calculatePerformers calculates top and worst performing investments
func (s *investmentService) calculatePerformers(ctx context.Context, userID, walletID int32, typeFilter protobufv1.InvestmentType) ([]*protobufv1.InvestmentPerformance, []*protobufv1.InvestmentPerformance, error) {
    // List all investments for the user/wallet
    listReq := &protobufv1.ListUserInvestmentsRequest{
        WalletId:    walletID,
        TypeFilter:  typeFilter,
        Pagination:  &protobufv1.PaginationParams{Page: 1, PageSize: 100},
    }

    listResp, err := s.ListUserInvestments(ctx, userID, listReq)
    if err != nil {
        return nil, nil, err
    }

    if len(listResp.Investments) == 0 {
        return []*protobufv1.InvestmentPerformance{}, []*protobufv1.InvestmentPerformance{}, nil
    }

    // Get user's preferred currency
    user, err := s.userRepo.GetByID(ctx, userID)
    if user == nil {
        return nil, nil, apperrors.NewNotFoundError("user")
    }

    // Convert to performance metrics and sort by PNL percentage
    performers := make([]*protobufv1.InvestmentPerformance, 0, len(listResp.Investments))
    for _, inv := range listResp.Investments {
        perf := &protobufv1.InvestmentPerformance{
            InvestmentId:          inv.Id,
            Symbol:                inv.Symbol,
            Name:                  inv.Name,
            Type:                  inv.Type,
            UnrealizedPnl:         inv.UnrealizedPnl,
            UnrealizedPnlPercent:  inv.UnrealizedPnlPercent,
            DisplayUnrealizedPnl:  inv.DisplayUnrealizedPnl,
            DisplayCurrency:       inv.DisplayCurrency,
        }
        performers = append(performers, perf)
    }

    // Sort by PNL percentage (descending)
    sort.Slice(performers, func(i, j int) bool {
        return performers[i].UnrealizedPnlPercent > performers[j].UnrealizedPnlPercent
    })

    // Get top 3 and bottom 3
    topCount := 3
    worstCount := 3

    if len(performers) < topCount {
        topCount = len(performers)
    }
    if len(performers) < worstCount {
        worstCount = len(performers)
    }

    topPerformers := performers[:topCount]
    worstPerformers := make([]*protobufv1.InvestmentPerformance, worstCount)

    // Get worst performers (from the end)
    for i := 0; i < worstCount; i++ {
        worstPerformers[i] = performers[len(performers)-1-i]
    }

    return topPerformers, worstPerformers, nil
}
```

**Step 4: Add sort import if not present**

Make sure `sort` is imported in the imports section:

```go
import (
    "sort" // Add this line
    // ... other imports
)
```

---

## Task 7: Backend HTTP Handler for Historical Values

**Files:**
- Modify: `src/go-backend/api/handlers/investment.go`
- Modify: `src/go-backend/api/handlers/routes.go`

**Step 1: Add handler function in investment.go**

Add this new handler function:

```go
// GetHistoricalPortfolioValues handles GET /api/v1/portfolio/historical-values
func (h *InvestmentHandler) GetHistoricalPortfolioValues(c *gin.Context) {
    // Get user ID from context (set by auth middleware)
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
        return
    }

    // Parse request parameters
    walletIDStr := c.DefaultQuery("walletId", "0")
    walletID, err := strconv.Atoi(walletIDStr)
    if err != nil {
        walletID = 0
    }

    typeFilterStr := c.DefaultQuery("typeFilter", "0")
    typeFilter, err := strconv.Atoi(typeFilterStr)
    if err != nil {
        typeFilter = 0
    }

    daysStr := c.DefaultQuery("days", "30")
    days, err := strconv.Atoi(daysStr)
    if err != nil || days <= 0 {
        days = 30
    }

    pointsStr := c.DefaultQuery("points", "10")
    points, err := strconv.Atoi(pointsStr)
    if err != nil || points <= 0 {
        points = 10
    }

    // Build request
    req := &investmentv1.GetHistoricalPortfolioValuesRequest{
        WalletId:   int32(walletID),
        TypeFilter: investmentv1.InvestmentType(typeFilter),
        Days:       int32(days),
        Points:     int32(points),
    }

    // Call service
    resp, err := h.portfolioHistorySvc.GetHistoricalValues(c, int32(userID.(int)), req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "success": false,
            "message": fmt.Sprintf("Failed to get historical values: %v", err),
        })
        return
    }

    c.JSON(http.StatusOK, resp)
}
```

**Step 2: Add PortfolioHistoryService to InvestmentHandler struct**

Update the InvestmentHandler struct to include the new service:

```go
type InvestmentHandler struct {
    investmentSvc      service.InvestmentService
    portfolioHistorySvc service.PortfolioHistoryService  // Add this line
    // ... other fields
}
```

**Step 3: Update NewInvestmentHandler constructor**

Add the portfolioHistorySvc parameter:

```go
func NewInvestmentHandler(
    investmentSvc service.InvestmentService,
    portfolioHistorySvc service.PortfolioHistoryService,  // Add this parameter
    userSvc service.UserService,
    // ... other parameters
) *InvestmentHandler {
    return &InvestmentHandler{
        investmentSvc:      investmentSvc,
        portfolioHistorySvc: portfolioHistorySvc,  // Add this line
        // ... other fields
    }
}
```

**Step 4: Add route in routes.go**

Find the investment routes section and add:

```go
// Historical portfolio values
investmentHandler.GET("/portfolio/historical-values", investmentHandler.GetHistoricalPortfolioValues)
```

---

## Task 8: Background Job for Portfolio Snapshots

**Files:**
- Create: `src/go-backend/cmd/snapshot-portfolio/main.go`

**Step 1: Write the snapshot command**

Create `src/go-backend/cmd/snapshot-portfolio/main.go`:

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"wealthjourney/domain/repository"
	"wealthjourney/domain/service"
	"wealthjourley/pkg/cache"
	"wealthjourley/pkg/config"
	"wealthjourley/pkg/gold"
	"wealthjourley/pkg/silver"
	"wealthjourley/pkg/yahoo"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to PostgreSQL database
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Name,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	ctx := context.Background()

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	walletRepo := repository.NewWalletRepository(db)
	investmentRepo := repository.NewInvestmentRepository(db)
	txRepo := repository.NewInvestmentTransactionRepository(db)
	historyRepo := repository.NewPortfolioHistoryRepository(db)

	// Initialize external services
	yahooClient := yahoo.NewClient(yahoo.DefaultConfig())
	cacheClient := cache.NewRedisClient(cfg.Redis)
	marketDataSvc := service.NewMarketDataService(db, yahooClient, cacheClient, 15*time.Minute)
	fxRateSvc := service.NewFXRateService(db, cacheClient)
	currencyCache := cache.NewCurrencyCache(db)
	goldConverter := gold.NewGoldConverter(fxRateSvc)
	silverConverter := silver.NewSilverConverter(fxRateSvc)

	// Initialize services
	walletService := service.NewWalletService(walletRepo, userRepo, fxRateSvc)
	investmentService := service.NewInvestmentService(
		investmentRepo, walletRepo, txRepo, marketDataSvc,
		userRepo, fxRateSvc, currencyCache, walletService,
	)
	historyService := service.NewPortfolioHistoryService(
		historyRepo, investmentService, userRepo, fxRateSvc,
	)

	// Get all users
	users, err := userRepo.ListAll(ctx)
	if err != nil {
		log.Fatalf("Failed to list users: %v", err)
	}

	fmt.Printf("Creating portfolio snapshots for %d users...\n", len(users))

	successCount := 0
	for _, user := range users {
		err := historyService.CreateAggregatedSnapshot(ctx, user.ID)
		if err != nil {
			log.Printf("Failed to create snapshot for user %d: %v", user.ID, err)
		} else {
			successCount++
			fmt.Printf("✓ User %d: snapshot created\n", user.ID)
		}
	}

	fmt.Printf("\nCompleted: %d/%d snapshots created\n", successCount, len(users))

	// Cleanup old records (older than 1 year)
	fmt.Println("\nCleaning up old records (older than 1 year)...")
	err = historyRepo.DeleteOldRecords(ctx, 365*24*time.Hour)
	if err != nil {
		log.Printf("Warning: failed to cleanup old records: %v", err)
	} else {
		fmt.Println("✓ Cleanup completed")
	}
}
```

---

## Task 9: Frontend - Historical Values Hook

**Files:**
- Regenerated: `src/wj-client/utils/generated/hooks.ts` (via protobuf)
- Regenerated: `src/wj-client/utils/generated/api.ts` (via protobuf)
- Regenerated: `src/wj-client/gen/protobuf/v1/investment.ts` (via protobuf)

**Note:** These files are auto-generated from protobuf. After running `task proto:all` in Task 1, they will contain the new hooks.

**Step 1: Verify generated hooks**

Check that the new hooks exist:

```bash
grep -n "useQueryGetHistoricalPortfolioValues\|GetHistoricalPortfolioValues" src/wj-client/utils/generated/hooks.ts
```

Expected output should show:
- `EVENT_InvestmentGetHistoricalPortfolioValues`
- `getHistoricalPortfolioValues` function
- `useQueryGetHistoricalPortfolioValues` hook

**Step 2: Create a custom hook for historical data**

Create `src/wj-client/hooks/usePortfolioHistoricalValues.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import {
  useQueryGetHistoricalPortfolioValues,
  EVENT_InvestmentGetHistoricalPortfolioValues,
} from "@/utils/generated/hooks";

export interface HistoricalValue {
  timestamp: number;
  value: number;
  date: string;
}

export interface UsePortfolioHistoricalValuesOptions {
  walletId?: number;
  typeFilter?: number;
  days?: number;
  points?: number;
  enabled?: boolean;
}

/**
 * Custom hook for fetching portfolio historical values
 * Returns data formatted for sparkline charts
 */
export function usePortfolioHistoricalValues({
  walletId = 0,
  typeFilter = 0,
  days = 30,
  points = 10,
  enabled = true,
}: UsePortfolioHistoricalValuesOptions = {}) {
  const result = useQueryGetHistoricalPortfolioValues(
    {
      walletId,
      typeFilter,
      days,
      points,
    },
    {
      enabled,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Transform data to sparkline format
  const sparklineData = result.data?.data?.map((point) => ({
    value: point.displayTotalValue?.amount ?? point.totalValue ?? 0,
    label: new Date(point.timestamp * 1000).toLocaleDateString(),
  })) ?? [];

  return {
    ...result,
    sparklineData,
  };
}
```

---

## Task 10: Frontend - Update PortfolioSummaryEnhanced Component

**Files:**
- Modify: `src/wj-client/app/dashboard/portfolio/components/PortfolioSummaryEnhanced.tsx`

**Step 1: Add imports for the new hook**

Add to the imports section:

```typescript
import { usePortfolioHistoricalValues } from "@/hooks/usePortfolioHistoricalValues";
```

**Step 2: Add props for historical data**

Update the `PortfolioSummaryEnhancedProps` interface to include filter parameters:

```typescript
export interface PortfolioSummaryEnhancedProps {
  portfolioSummary: PortfolioSummaryData;
  userCurrency: string;
  onRefreshPrices?: () => void;
  onAddInvestment?: () => void;
  isRefreshing?: boolean;
  // Add these new props:
  walletId?: number;
  typeFilter?: number;
}
```

**Step 3: Replace mock sparkline data with real data**

Find the `sparklineData` useMemo (around line 162) and replace it with:

```typescript
// Fetch historical values for sparkline
const { sparklineData: historicalSparklineData, isLoading: isLoadingHistory } =
  usePortfolioHistoricalValues({
    walletId: props.walletId ?? 0,
    typeFilter: props.typeFilter ?? 0,
    days: 30,
    points: 10,
    enabled: portfolioSummary.totalValue > 0,
  });

// Use historical data if available, otherwise fallback to current value
const sparklineData = useMemo(() => {
  if (historicalSparklineData.length > 0) {
    return historicalSparklineData;
  }
  // Fallback: show flat line at current value if no history
  return [{ value: displayValue }];
}, [historicalSparklineData, displayValue]);
```

**Step 4: Replace mock asset allocation with real data**

Find the `assetAllocationData` useMemo (around line 179) and replace it with:

```typescript
// Prepare asset allocation data from API
const assetAllocationData = useMemo(() => {
  const investmentsByType = portfolioSummary.investmentsByType;

  if (!investmentsByType || investmentsByType.length === 0) {
    return [];
  }

  // Map InvestmentType enum to display names
  const typeNames: Record<number, string> = {
    0: "Other",
    1: "Cryptocurrency",
    2: "Stock",
    3: "ETF",
    4: "Mutual Fund",
    5: "Bond",
    6: "Commodity",
    7: "Other",
    8: "Gold (Vietnam)",
    9: "Gold (World)",
    10: "Silver (Vietnam)",
    11: "Silver (World)",
  };

  return investmentsByType
    .filter((item) => item.totalValue > 0)
    .map((item) => ({
      name: typeNames[item.type] ?? `Type ${item.type}`,
      value: item.totalValue,
      color: undefined,
    }));
}, [portfolioSummary.investmentsByType]);
```

**Step 5: Replace mock best performer with real data**

Find the `topPerformer` useMemo (around line 201) and replace it with:

```typescript
// Top performer from API data
const topPerformer = useMemo(() => {
  const topPerformers = portfolioSummary.topPerformers;

  if (!topPerformers || topPerformers.length === 0) {
    return null;
  }

  const best = topPerformers[0];
  return {
    name: best.symbol,
    value: `${best.unrealizedPnlPercent >= 0 ? '+' : ''}${best.unrealizedPnlPercent.toFixed(2)}%`,
    positive: best.unrealizedPnlPercent >= 0,
  };
}, [portfolioSummary.topPerformers]);
```

**Step 6: Update the component function signature**

Add the new props parameter:

```typescript
export const PortfolioSummaryEnhanced = memo(function PortfolioSummaryEnhanced({
  portfolioSummary,
  userCurrency,
  onRefreshPrices,
  onAddInvestment,
  isRefreshing = false,
  walletId = 0,
  typeFilter = 0,
}: PortfolioSummaryEnhancedProps) {
  // ... rest of component
```

---

## Task 11: Frontend - Update Portfolio Page to Pass Props

**Files:**
- Modify: `src/wj-client/app/dashboard/portfolio/page.tsx`

**Step 1: Update the PortfolioSummaryEnhanced component call**

Find the `PortfolioSummaryEnhanced` component usage (around line 457) and update it to pass the new props:

```typescript
<PortfolioSummaryEnhanced
  portfolioSummary={portfolioSummary}
  userCurrency={currency}
  onRefreshPrices={handleRefreshPrices}
  onAddInvestment={() => handleOpenModal(ModalType.ADD_INVESTMENT)}
  isRefreshing={updatePricesMutation.isPending || showUpdateBanner}
  walletId={walletIdForApi}
  typeFilter={typeFilterForApi}
/>
```

---

## Task 12: Backend - Wire Up PortfolioHistoryService in Main Application

**Files:**
- Modify: `src/go-backend/cmd/main.go`

**Step 1: Add PortfolioHistoryRepository and PortfolioHistoryService initialization**

Find the service initialization section and add:

```go
// After portfolioHistoryRepo initialization
portfolioHistoryRepo := repository.NewPortfolioHistoryRepository(db)

// After investmentService initialization
portfolioHistoryService := service.NewPortfolioHistoryService(
    portfolioHistoryRepo,
    investmentService,
    userService,
    fxRateService,
)
```

**Step 2: Update InvestmentHandler initialization**

Update the `handlers.NewInvestmentHandler` call to include the new service:

```go
investmentHandler := handlers.NewInvestmentHandler(
    investmentService,
    portfolioHistoryService,  // Add this parameter
    userService,
    // ... other existing parameters
)
```

---

## Task 13: Database Migration for Portfolio History Table

**Files:**
- Create: `src/go-backend/cmd/migrate-portfolio-history/main.go`

**Step 1: Write the migration command**

Create `src/go-backend/cmd/migrate-portfolio-history/main.go`:

```go
package main

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"wealthjourney/domain/models"
)

func main() {
	// Database connection - adjust as needed for your environment
	dsn := "host=localhost port=5432 user=postgres password=postgres dbname=wealthjourney sslmode=disable"

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	fmt.Println("Running portfolio_history table migration...")

	// Create the portfolio_history table
	err = db.AutoMigrate(&models.PortfolioHistory{})
	if err != nil {
		log.Fatalf("Failed to migrate portfolio_history table: %v", err)
	}

	fmt.Println("✓ portfolio_history table created successfully")

	// Create indexes for better query performance
	fmt.Println("\nCreating indexes...")

	// Index for user + wallet lookups
	err = db.Exec("CREATE INDEX IF NOT EXISTS idx_user_wallet_timestamp ON portfolio_history(user_id, wallet_id, timestamp)").Error
	if err != nil {
		log.Printf("Warning: failed to create idx_user_wallet_timestamp: %v", err)
	} else {
		fmt.Println("✓ Created idx_user_wallet_timestamp")
	}

	// Index for time-based queries
	err = db.Exec("CREATE INDEX IF NOT EXISTS idx_timestamp ON portfolio_history(timestamp)").Error
	if err != nil {
		log.Printf("Warning: failed to create idx_timestamp: %v", err)
	} else {
		fmt.Println("✓ Created idx_timestamp")
	}

	fmt.Println("\nMigration completed successfully!")
}
```

**Step 2: Run the migration**

Run: `cd src/go-backend && go run ./cmd/migrate-portfolio-history`
Expected output:
```
Running portfolio_history table migration...
✓ portfolio_history table created successfully

Creating indexes...
✓ Created idx_user_wallet_timestamp
✓ Created idx_timestamp

Migration completed successfully!
```

---

## Task 14: Testing - Backend Unit Tests

**Files:**
- Create: `src/go-backend/domain/service/portfolio_history_service_test.go`

**Step 1: Write unit tests for PortfolioHistoryService**

Create the test file:

```go
package service

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"

	"wealthjourney/domain/models"
	"wealthjourney/protobuf/v1"
)

// Mock implementations
type MockPortfolioHistoryRepository struct {
	mock.Mock
}

func (m *MockPortfolioHistoryRepository) Create(ctx context.Context, history *models.PortfolioHistory) error {
	args := m.Called(ctx, history)
	return args.Error(0)
}

func (m *MockPortfolioHistoryRepository) GetLatestByWallet(ctx context.Context, userID, walletID int32) (*models.PortfolioHistory, error) {
	args := m.Called(ctx, userID, walletID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PortfolioHistory), args.Error(1)
}

// ... implement other mock methods similarly

type MockInvestmentService struct {
	mock.Mock
}

func (m *MockInvestmentService) GetPortfolioSummary(ctx context.Context, userID, walletID int32) (*protobufv1.GetPortfolioSummaryResponse, error) {
	args := m.Called(ctx, userID, walletID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*protobufv1.GetPortfolioSummaryResponse), args.Error(1)
}

// ... implement other required methods

type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) GetByID(ctx context.Context, id int32) (*models.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

// ... implement other required methods

type MockFXRateService struct {
	mock.Mock
}

func (m *MockFXRateService) GetRate(ctx context.Context, from, to string) (float64, error) {
	args := m.Called(ctx, from, to)
	return args.Get(0).(float64), args.Error(1)
}

// Test: GetHistoricalValues returns sampled data
func TestPortfolioHistoryService_GetHistoricalValues(t *testing.T) {
	// Setup
	mockHistoryRepo := new(MockPortfolioHistoryRepository)
	mockInvestmentSvc := new(MockInvestmentService)
	mockUserRepo := new(MockUserRepository)
	mockFxRateSvc := new(MockFXRateService)

	service := NewPortfolioHistoryService(mockHistoryRepo, mockInvestmentSvc, mockUserRepo, mockFxRateSvc)

	ctx := context.Background()
	userID := int32(1)

	// Mock user
	mockUser := &models.User{
		ID:                1,
		PreferredCurrency: "USD",
	}
	mockUserRepo.On("GetByID", ctx, userID).Return(mockUser, nil)

	// Mock historical data
	now := time.Now()
	histories := make([]*models.PortfolioHistory, 20)
	for i := 0; i < 20; i++ {
		histories[i] = &models.PortfolioHistory{
			UserID:     userID,
			WalletID:   1,
			TotalValue: int64(10000 + i*100),
			Currency:   "USD",
			Timestamp:  now.Add(-time.Duration(20-i) * time.Hour),
		}
	}

	mockHistoryRepo.On("GetAggregatedHistory", ctx, userID, mock.Anything, mock.Anything, 40).Return(histories, nil)

	// Execute
	req := &protobufv1.GetHistoricalPortfolioValuesRequest{
		WalletId: 0,
		Days:     30,
		Points:   10,
	}

	resp, err := service.GetHistoricalValues(ctx, userID, req)

	// Assert
	assert.NoError(t, err)
	assert.True(t, resp.Success)
	assert.Len(t, resp.Data, 10) // Should be sampled to 10 points
	assert.Greater(t, resp.Data[0].Timestamp, resp.Data[len(resp.Data)-1].Timestamp)

	// Verify mock expectations
	mockHistoryRepo.AssertExpectations(t)
	mockUserRepo.AssertExpectations(t)
}

// Test: CreateSnapshot stores portfolio summary as history
func TestPortfolioHistoryService_CreateSnapshot(t *testing.T) {
	// Setup
	mockHistoryRepo := new(MockPortfolioHistoryRepository)
	mockInvestmentSvc := new(MockInvestmentService)
	mockUserRepo := new(MockUserRepository)
	mockFxRateSvc := new(MockFXRateService)

	service := NewPortfolioHistoryService(mockHistoryRepo, mockInvestmentSvc, mockUserRepo, mockFxRateSvc)

	ctx := context.Background()
	userID := int32(1)
	walletID := int32(2)

	// Mock portfolio summary
	summary := &protobufv1.PortfolioSummary{
		TotalValue: 100000,
		TotalCost:  80000,
		TotalPnl:   20000,
		Currency:   "USD",
	}

	summaryResp := &protobufv1.GetPortfolioSummaryResponse{
		Success: true,
		Data:    summary,
	}

	mockInvestmentSvc.On("GetPortfolioSummary", ctx, userID, walletID).Return(summaryResp, nil)
	mockHistoryRepo.On("CreateSnapshotIfNotDuplicate", ctx, mock.AnythingOfType("*models.PortfolioHistory")).Return(&models.PortfolioHistory{}, nil)

	// Execute
	err := service.CreateSnapshot(ctx, userID, walletID)

	// Assert
	assert.NoError(t, err)
	mockInvestmentSvc.AssertExpectations(t)
	mockHistoryRepo.AssertExpectations(t)
}
```

**Step 2: Run the tests**

Run: `cd src/go-backend && go test ./domain/service/portfolio_history_service_test.go -v`
Expected: Tests pass successfully

---

## Task 15: Testing - Frontend Component Tests

**Files:**
- Create: `src/wj-client/app/dashboard/portfolio/components/PortfolioSummaryEnhanced.test.tsx`

**Step 1: Write component tests**

Create the test file:

```typescript
import { render, screen } from "@testing-library/react";
import { PortfolioSummaryEnhanced, PortfolioSummaryData } from "./PortfolioSummaryEnhanced";

// Mock the custom hook
jest.mock("@/hooks/usePortfolioHistoricalValues", () => ({
  usePortfolioHistoricalValues: jest.fn(),
}));

import { usePortfolioHistoricalValues } from "@/hooks/usePortfolioHistoricalValues";

const mockUsePortfolioHistoricalValues = usePortfolioHistoricalValues as jest.MockedFunction<typeof usePortfolioHistoricalValues>;

describe("PortfolioSummaryEnhanced", () => {
  const baseProps = {
    portfolioSummary: {
      displayTotalValue: { amount: 100000, currency: "USD" },
      displayTotalCost: { amount: 80000, currency: "USD" },
      displayTotalPnl: { amount: 20000, currency: "USD" },
      displayCurrency: "USD",
      totalInvestments: 5,
      investmentsByType: [
        { type: 2, totalValue: 50000, count: 2 }, // Stock
        { type: 1, totalValue: 30000, count: 1 }, // Crypto
        { type: 3, totalValue: 20000, count: 2 }, // ETF
      ],
      topPerformers: [
        {
          investmentId: 1,
          symbol: "AAPL",
          name: "Apple Inc.",
          type: 2,
          unrealizedPnl: 5000,
          unrealizedPnlPercent: 12.5,
          displayUnrealizedPnl: { amount: 5000, currency: "USD" },
          displayCurrency: "USD",
        },
      ],
    } as PortfolioSummaryData,
    userCurrency: "USD",
    walletId: 0,
    typeFilter: 0,
  };

  beforeEach(() => {
    mockUsePortfolioHistoricalValues.mockReturnValue({
      sparklineData: [
        { value: 80000, label: "1/1" },
        { value: 85000, label: "1/2" },
        { value: 90000, label: "1/3" },
        { value: 100000, label: "1/4" },
      ],
      isLoading: false,
      error: null,
    } as any);
  });

  it("renders portfolio summary cards with real data", () => {
    render(<PortfolioSummaryEnhanced {...baseProps} />);

    expect(screen.getByText("Total Value")).toBeInTheDocument();
    expect(screen.getByText("Total Cost")).toBeInTheDocument();
    expect(screen.getByText("Total PNL")).toBeInTheDocument();
    expect(screen.getByText("Holdings")).toBeInTheDocument();
  });

  it("displays sparkline with historical data", () => {
    render(<PortfolioSummaryEnhanced {...baseProps} />);

    // Sparkline should be rendered (check by presence of chart container)
    const sparklineContainer = document.querySelector(".recharts-wrapper");
    expect(sparklineContainer).toBeInTheDocument();
  });

  it("shows asset allocation chart with real type breakdown", () => {
    render(<PortfolioSummaryEnhanced {...baseProps} />);

    expect(screen.getByText("Asset Allocation")).toBeInTheDocument();
    expect(screen.getByText("Distribution by investment type")).toBeInTheDocument();
  });

  it("displays top performer from API data", () => {
    render(<PortfolioSummaryEnhanced {...baseProps} />);

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("+12.50%")).toBeInTheDocument();
  });

  it("shows empty state when no investments", () => {
    const emptyProps = {
      ...baseProps,
      portfolioSummary: {
        ...baseProps.portfolioSummary,
        totalInvestments: 0,
        investmentsByType: [],
      } as any,
    };

    render(<PortfolioSummaryEnhanced {...emptyProps} />);

    // Asset allocation should not be shown when empty
    expect(screen.queryByText("Asset Allocation")).not.toBeInTheDocument();
  });
});
```

**Step 2: Run the tests**

Run: `cd src/wj-client && npm test -- PortfolioSummaryEnhanced.test.tsx`
Expected: All tests pass

---

## Task 16: Manual Testing and Validation

**Files:**
- None (manual testing)

**Step 1: Start the backend**

Run: `task dev:backend`
Expected: Backend starts on configured port (default 3001)

**Step 2: Run the migration**

Run: `cd src/go-backend && go run ./cmd/migrate-portfolio-history`
Expected: Table created successfully

**Step 3: Create initial historical snapshots**

Run: `cd src/go-backend && go run ./cmd/snapshot-portfolio`
Expected: Snapshots created for all users

**Step 4: Start the frontend**

Run: `task dev:frontend`
Expected: Frontend starts on http://localhost:3000

**Step 5: Test the portfolio page**

1. Navigate to http://localhost:3000/dashboard/portfolio
2. Verify:
   - Total Value card shows sparkline with historical trend
   - Sparkline colors correctly (green if up, red if down)
   - Asset Allocation chart shows actual investment types
   - "Best Performer" badge shows real data with correct percentage
   - Filter controls (wallet, type) update charts correctly
   - Empty states work when no historical data exists

**Step 6: Test API endpoints directly**

```bash
# Test historical values endpoint
curl -X GET "http://localhost:3001/api/v1/portfolio/historical-values?walletId=0&days=30&points=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test aggregated portfolio summary (should include top/worst performers)
curl -X GET "http://localhost:3001/api/v1/portfolio-summary" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Step 7: Validate database**

```sql
-- Check portfolio_history table has data
SELECT COUNT(*) FROM portfolio_history;

-- Verify data structure
SELECT * FROM portfolio_history ORDER BY timestamp DESC LIMIT 10;

-- Check for duplicate prevention
SELECT user_id, wallet_id, DATE(timestamp) as date, COUNT(*)
FROM portfolio_history
GROUP BY user_id, wallet_id, date
HAVING COUNT(*) > 1;
```

**Step 8: Performance check**

- Historical values query should return in < 100ms
- Portfolio summary query should return in < 200ms
- Page load time should be < 2 seconds

---

## Task 17: Deploy and Monitor

**Files:**
- Modify: Deployment configuration (Vercel)

**Step 1: Update backend dependencies**

Ensure all new dependencies are available:
- GORM models include PortfolioHistory
- Services are wired up correctly
- Routes are registered

**Step 2: Deploy backend**

Run: `task deploy:backend`
Expected: Backend deploys to Vercel successfully

**Step 3: Deploy frontend**

Run: `cd src/wj-client && npm run build`
Expected: Build completes without errors

**Step 4: Run database migration in production**

Execute the migration on production database:
```bash
# Using production database connection
cd src/go-backend && go run ./cmd/migrate-portfolio-history
```

**Step 5: Set up automated snapshots**

Create a cron job or scheduled task to run snapshot-portfolio periodically:
- Run every hour for active users
- Run daily for all users
- Cleanup records older than 1 year

**Step 6: Monitor metrics**

Check:
- API response times for historical values
- Database query performance
- Error rates
- Storage usage for portfolio_history table

---

## Summary

This implementation plan adds real data support for all portfolio page charts:

### What's Being Implemented:

1. **Total Value Sparkline**
   - New `PortfolioHistory` model to store historical snapshots
   - `PortfolioHistoryService` with data sampling for efficient querying
   - `GetHistoricalPortfolioValues` API endpoint
   - Frontend hook `usePortfolioHistoricalValues`
   - Integration into `PortfolioSummaryEnhanced` component

2. **Asset Allocation Chart**
   - Uses existing `investmentsByType` from `PortfolioSummary` API
   - Maps investment types to display names
   - Proper color palette from constants

3. **Best Performer Badge**
   - Top/worst performers calculated in `InvestmentService`
   - Added to `PortfolioSummary` response
   - Displayed in `PortfolioSummaryEnhanced` component

### Technical Highlights:

- **Efficient data storage**: Snapshots stored hourly, sampled for display
- **Duplicate prevention**: Recent snapshots updated instead of creating duplicates
- **Background job**: Scheduled snapshots for continuous historical data
- **Automatic cleanup**: Old records removed after 1 year
- **Currency conversion**: Historical values converted to user's preferred currency
- **Type-safe**: Full TypeScript support through protobuf generation

### Testing Coverage:

- Backend unit tests for `PortfolioHistoryService`
- Frontend component tests for `PortfolioSummaryEnhanced`
- Manual testing checklist for validation
- Performance benchmarks for API endpoints

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-02-07-portfolio-real-data-charts.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
