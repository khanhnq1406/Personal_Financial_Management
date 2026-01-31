package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"wealthjourney/pkg/gold"
)

// GoldHandler handles gold-related endpoints
type GoldHandler struct{}

// NewGoldHandler creates a new gold handler
func NewGoldHandler() *GoldHandler {
	return &GoldHandler{}
}

// GetGoldTypeCodes returns available gold type codes for investment creation
// GET /api/v1/investments/gold-types
func (h *GoldHandler) GetGoldTypeCodes(c *gin.Context) {
	currency := c.Query("currency") // Optional filter: "VND", "USD", or empty for all

	var result []map[string]interface{}

	// Use gold types from the gold package
	if currency != "" {
		// Filter by currency
		goldTypes := gold.GetGoldTypesByCurrency(currency)
		result = make([]map[string]interface{}, len(goldTypes))
		for i, gt := range goldTypes {
			result[i] = map[string]interface{}{
				"code":       gt.Code,
				"name":       gt.Name,
				"currency":   gt.Currency,
				"unit":       string(gt.Unit),
				"unitWeight": gt.UnitWeight,
				"type":       int32(gt.Type),
			}
		}
	} else {
		// Return all gold types
		result = make([]map[string]interface{}, len(gold.GoldTypes))
		for i, gt := range gold.GoldTypes {
			result[i] = map[string]interface{}{
				"code":       gt.Code,
				"name":       gt.Name,
				"currency":   gt.Currency,
				"unit":       string(gt.Unit),
				"unitWeight": gt.UnitWeight,
				"type":       int32(gt.Type),
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"message":   "Gold type codes retrieved successfully",
		"data":      result,
		"timestamp": time.Now().Format(time.RFC3339),
	})
}
