package device

import (
	"strings"
	"wealthjourney/pkg/redis"

	"github.com/gin-gonic/gin"
)

// ExtractDeviceInfo extracts device information from HTTP request headers
func ExtractDeviceInfo(c *gin.Context) *redis.SessionData {
	userAgent := c.GetHeader("User-Agent")
	ip := GetClientIP(c)

	deviceName, deviceType := parseUserAgent(userAgent)

	return &redis.SessionData{
		DeviceName: deviceName,
		DeviceType: deviceType,
		IPAddress:  ip,
		UserAgent:  userAgent,
	}
}

// GetClientIP extracts the real client IP from request headers
func GetClientIP(c *gin.Context) string {
	// Try X-Real-IP first (nginx, cloudflare)
	ip := c.GetHeader("X-Real-IP")
	if ip != "" {
		return ip
	}

	// Try X-Forwarded-For (load balancers)
	forwarded := c.GetHeader("X-Forwarded-For")
	if forwarded != "" {
		// X-Forwarded-For can contain multiple IPs, take the first one
		ips := strings.Split(forwarded, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	// Fallback to RemoteAddr
	ip = c.ClientIP()
	if ip != "" {
		return ip
	}

	return "unknown"
}

// parseUserAgent extracts device name and type from User-Agent string
func parseUserAgent(userAgent string) (deviceName string, deviceType string) {
	ua := strings.ToLower(userAgent)

	// Mobile devices
	if strings.Contains(ua, "iphone") {
		return "iPhone", "mobile"
	}
	if strings.Contains(ua, "android") && !strings.Contains(ua, "tablet") {
		return "Android", "mobile"
	}

	// Tablets
	if strings.Contains(ua, "ipad") {
		return "iPad", "tablet"
	}
	if strings.Contains(ua, "android") && strings.Contains(ua, "tablet") {
		return "Android Tablet", "tablet"
	}

	// Desktop
	if strings.Contains(ua, "macintosh") || strings.Contains(ua, "mac os x") {
		return "Desktop", "desktop"
	}
	if strings.Contains(ua, "windows") {
		return "Desktop", "desktop"
	}
	if strings.Contains(ua, "linux") && !strings.Contains(ua, "android") {
		return "Desktop", "desktop"
	}

	// Default
	return "Unknown Device", "unknown"
}
