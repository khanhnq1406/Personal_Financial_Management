package device_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"wealthjourney/pkg/device"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestExtractDeviceInfo(t *testing.T) {
	tests := []struct {
		name           string
		userAgent      string
		xRealIP        string
		xForwardedFor  string
		expectedDevice string
		expectedType   string
	}{
		{
			name:           "iPhone user agent",
			userAgent:      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
			xRealIP:        "192.168.1.100",
			expectedDevice: "iPhone",
			expectedType:   "mobile",
		},
		{
			name:           "Android user agent",
			userAgent:      "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36",
			xRealIP:        "192.168.1.101",
			expectedDevice: "Android",
			expectedType:   "mobile",
		},
		{
			name:           "iPad user agent",
			userAgent:      "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
			xRealIP:        "192.168.1.102",
			expectedDevice: "iPad",
			expectedType:   "tablet",
		},
		{
			name:           "Mac desktop",
			userAgent:      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
			xRealIP:        "192.168.1.103",
			expectedDevice: "Desktop",
			expectedType:   "desktop",
		},
		{
			name:           "Windows desktop",
			userAgent:      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			xRealIP:        "192.168.1.104",
			expectedDevice: "Desktop",
			expectedType:   "desktop",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create mock Gin context
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			req, _ := http.NewRequest("POST", "/test", nil)
			req.Header.Set("User-Agent", tt.userAgent)
			req.Header.Set("X-Real-IP", tt.xRealIP)
			if tt.xForwardedFor != "" {
				req.Header.Set("X-Forwarded-For", tt.xForwardedFor)
			}
			c.Request = req

			deviceInfo := device.ExtractDeviceInfo(c)

			assert.Equal(t, tt.expectedDevice, deviceInfo.DeviceName)
			assert.Equal(t, tt.expectedType, deviceInfo.DeviceType)
			assert.Equal(t, tt.xRealIP, deviceInfo.IPAddress)
			assert.Equal(t, tt.userAgent, deviceInfo.UserAgent)
		})
	}
}

func TestGetClientIP(t *testing.T) {
	tests := []struct {
		name          string
		xRealIP       string
		xForwardedFor string
		remoteAddr    string
		expected      string
	}{
		{
			name:     "X-Real-IP present",
			xRealIP:  "203.0.113.1",
			expected: "203.0.113.1",
		},
		{
			name:          "X-Forwarded-For present",
			xForwardedFor: "203.0.113.2, 10.0.0.1",
			expected:      "203.0.113.2",
		},
		{
			name:       "RemoteAddr fallback",
			remoteAddr: "203.0.113.3:12345",
			expected:   "203.0.113.3",
		},
		{
			name:     "Unknown IP",
			expected: "unknown",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			req, _ := http.NewRequest("GET", "/test", nil)
			if tt.xRealIP != "" {
				req.Header.Set("X-Real-IP", tt.xRealIP)
			}
			if tt.xForwardedFor != "" {
				req.Header.Set("X-Forwarded-For", tt.xForwardedFor)
			}
			if tt.remoteAddr != "" {
				req.RemoteAddr = tt.remoteAddr
			}
			c.Request = req

			ip := device.GetClientIP(c)
			assert.Equal(t, tt.expected, ip)
		})
	}
}
