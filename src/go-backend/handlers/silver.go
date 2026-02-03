package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"wealthjourney/pkg/silver"
)

// SilverHandler handles silver-related endpoints
type SilverHandler struct{}

// NewSilverHandler creates a new silver handler
func NewSilverHandler() *SilverHandler {
	return &SilverHandler{}
}

// GetSilverTypeCodes returns available silver type codes for investment creation
// GET /api/v1/investments/silver-types
func (h *SilverHandler) GetSilverTypeCodes(c *gin.Context) {
	currency := c.Query("currency") // Optional filter: "VND", "USD", or empty for all

	var result []map[string]interface{}

	// Use silver types from the silver package
	if currency != "" {
		// Filter by currency
		silverTypes := silver.GetSilverTypesByCurrency(currency)
		result = make([]map[string]interface{}, len(silverTypes))
		for i, st := range silverTypes {
			result[i] = map[string]interface{}{
				"code":     st.Code,
				"name":     st.Name,
				"currency": st.Currency,
				"type":     int32(st.Type),
			}
		}
	} else {
		// Return all silver types
		result = make([]map[string]interface{}, len(silver.SilverTypes))
		for i, st := range silver.SilverTypes {
			result[i] = map[string]interface{}{
				"code":     st.Code,
				"name":     st.Name,
				"currency": st.Currency,
				"type":     int32(st.Type),
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"message":   "Silver type codes retrieved successfully",
		"data":      result,
		"timestamp": time.Now().Format(time.RFC3339),
	})
}
