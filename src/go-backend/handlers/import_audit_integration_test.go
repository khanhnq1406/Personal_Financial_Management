// +build integration

package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"wealthjourney/pkg/device"
)

// TestDeviceIPExtraction_DifferentHeaders tests IP extraction from various headers
func TestDeviceIPExtraction_DifferentHeaders(t *testing.T) {
	testCases := []struct {
		name                      string
		headers                   map[string]string
		expectedIP                string
		expectedContainsUserAgent bool
	}{
		{
			name: "X-Real-IP header",
			headers: map[string]string{
				"X-Real-IP":  "192.168.1.100",
				"User-Agent": "Mozilla/5.0",
			},
			expectedIP:                "192.168.1.100",
			expectedContainsUserAgent: true,
		},
		{
			name: "X-Forwarded-For with multiple IPs",
			headers: map[string]string{
				"X-Forwarded-For": "203.0.113.195, 70.41.3.18, 150.172.238.178",
				"User-Agent":      "curl/7.64.1",
			},
			expectedIP:                "203.0.113.195",
			expectedContainsUserAgent: true,
		},
		{
			name: "Mobile user agent",
			headers: map[string]string{
				"X-Real-IP":  "10.0.0.5",
				"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
			},
			expectedIP:                "10.0.0.5",
			expectedContainsUserAgent: true,
		},
		{
			name: "Desktop browser user agent",
			headers: map[string]string{
				"X-Real-IP":  "172.16.0.1",
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
			},
			expectedIP:                "172.16.0.1",
			expectedContainsUserAgent: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)

			// Create test context
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodGet, "/test", nil)

			// Set headers
			for key, value := range tc.headers {
				c.Request.Header.Set(key, value)
			}

			// Extract IP and User-Agent
			ipAddress := device.GetClientIP(c)
			userAgent := c.GetHeader("User-Agent")

			// Verify extraction
			assert.Equal(t, tc.expectedIP, ipAddress, "IP address should match expected")
			if tc.expectedContainsUserAgent {
				assert.NotEmpty(t, userAgent, "User-Agent should not be empty")
			}

			t.Logf("Extracted IP: %s, User-Agent: %s", ipAddress, userAgent)
		})
	}
}

// TestAuditLogContext tests that audit logging captures request context correctly
func TestAuditLogContext(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Test data
	testIP := "192.168.1.100"
	testUserAgent := "Mozilla/5.0 (Test Browser)"

	// Create test context
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/import/confirm", nil)
	c.Request.Header.Set("X-Real-IP", testIP)
	c.Request.Header.Set("User-Agent", testUserAgent)

	// Extract context information
	ipAddress := device.GetClientIP(c)
	userAgent := c.GetHeader("User-Agent")

	// Verify extraction
	assert.Equal(t, testIP, ipAddress, "IP address should be extracted from X-Real-IP header")
	assert.Equal(t, testUserAgent, userAgent, "User-Agent should be extracted from header")

	t.Logf("Successfully extracted audit context - IP: %s, UA: %s", ipAddress, userAgent)
}

// TestAuditLogWithProxyHeaders tests IP extraction with various proxy headers
func TestAuditLogWithProxyHeaders(t *testing.T) {
	testCases := []struct {
		name       string
		realIP     string
		forwarded  string
		expectedIP string
	}{
		{
			name:       "X-Real-IP takes precedence",
			realIP:     "192.168.1.100",
			forwarded:  "203.0.113.195",
			expectedIP: "192.168.1.100",
		},
		{
			name:       "X-Forwarded-For used when X-Real-IP absent",
			realIP:     "",
			forwarded:  "203.0.113.195, 70.41.3.18",
			expectedIP: "203.0.113.195",
		},
		{
			name:       "First IP in X-Forwarded-For chain",
			realIP:     "",
			forwarded:  "10.0.0.1, 10.0.0.2, 10.0.0.3",
			expectedIP: "10.0.0.1",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodPost, "/test", nil)

			if tc.realIP != "" {
				c.Request.Header.Set("X-Real-IP", tc.realIP)
			}
			if tc.forwarded != "" {
				c.Request.Header.Set("X-Forwarded-For", tc.forwarded)
			}

			ipAddress := device.GetClientIP(c)
			assert.Equal(t, tc.expectedIP, ipAddress)

			t.Logf("Test case '%s': extracted IP = %s", tc.name, ipAddress)
		})
	}
}
