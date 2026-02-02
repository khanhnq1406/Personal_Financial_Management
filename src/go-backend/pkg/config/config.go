package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Server       Server
	Database     Database
	Redis        Redis
	JWT          JWT
	Google       Google
	RateLimit    RateLimit
	YahooFinance YahooFinance
}

type Server struct {
	Port            string
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	ShutdownTimeout time.Duration
}

type Database struct {
	Host            string
	Port            string
	User            string
	Password        string
	Name            string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	ConnMaxIdleTime time.Duration
}

type Redis struct {
	URL      string
	Password string
	DB       int
}

type JWT struct {
	Secret     string
	Expiration time.Duration
}

type Google struct {
	ClientID string
}

type RateLimit struct {
	RequestsPerMinute int
}

type YahooFinance struct {
	Enabled          bool
	Timeout          time.Duration
	MaxRetries       int
	RetryDelay       time.Duration
	CacheMaxAge      time.Duration
	FallbackToStale  bool
	RequestsPerMin   int
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file if exists
	_ = godotenv.Load()

	// Parse durations
	readTimeout, _ := time.ParseDuration(getEnv("SERVER_READ_TIMEOUT", "10s"))
	writeTimeout, _ := time.ParseDuration(getEnv("SERVER_WRITE_TIMEOUT", "10s"))
	shutdownTimeout, _ := time.ParseDuration(getEnv("SERVER_SHUTDOWN_TIMEOUT", "30s"))

	jwtExpiration, _ := time.ParseDuration(os.Getenv("JWT_EXPIRATION"))
	if jwtExpiration == 0 {
		jwtExpiration = 168 * time.Hour // 7 days default
	}

	// Database pool settings
	// Supabase recommends: max 15 connections for Pro tier, 60 for Enterprise
	maxOpenConns, _ := strconv.Atoi(getEnv("DB_MAX_OPEN_CONNS", "15"))
	maxIdleConns, _ := strconv.Atoi(getEnv("DB_MAX_IDLE_CONNS", "5"))
	// Longer lifetime for Supabase to reduce connection churn
	connMaxLifetime, _ := time.ParseDuration(getEnv("DB_CONN_MAX_LIFETIME", "1h"))
	// Keep idle connections available but not too long
	connMaxIdleTime, _ := time.ParseDuration(getEnv("DB_CONN_MAX_IDLE_TIME", "10m"))

	// Rate limit settings
	requestsPerMinute, _ := strconv.Atoi(getEnv("RATE_LIMIT_REQUESTS_PER_MINUTE", "60"))

	// Yahoo Finance settings
	yahooTimeout, _ := time.ParseDuration(getEnv("YAHOO_FINANCE_TIMEOUT", "10s"))
	yahooRetryDelay, _ := time.ParseDuration(getEnv("YAHOO_FINANCE_RETRY_DELAY", "1s"))
	yahooCacheMaxAge, _ := time.ParseDuration(getEnv("YAHOO_FINANCE_CACHE_MAX_AGE", "15m"))
	yahooMaxRetries, _ := strconv.Atoi(getEnv("YAHOO_FINANCE_MAX_RETRIES", "3"))
	yahooRequestsPerMin, _ := strconv.Atoi(getEnv("YAHOO_FINANCE_REQUESTS_PER_MIN", "120"))
	yahooEnabled, _ := strconv.ParseBool(getEnv("YAHOO_FINANCE_ENABLED", "true"))
	yahooFallbackToStale, _ := strconv.ParseBool(getEnv("YAHOO_FINANCE_FALLBACK_STALE", "true"))

	cfg := &Config{
		Server: Server{
			Port:            getEnv("PORT", "5000"),
			ReadTimeout:     readTimeout,
			WriteTimeout:    writeTimeout,
			ShutdownTimeout: shutdownTimeout,
		},
		Database: Database{
			Host:            getEnv("DB_HOST", "localhost"),
			Port:            getEnv("DB_PORT", "3306"),
			User:            getEnv("DB_USER", "root"),
			Password:        getEnv("DB_PASSWORD", ""),
			Name:            getEnv("DB_NAME", "wealthjourney"),
			MaxOpenConns:    maxOpenConns,
			MaxIdleConns:    maxIdleConns,
			ConnMaxLifetime: connMaxLifetime,
			ConnMaxIdleTime: connMaxIdleTime,
		},
		Redis: Redis{
			URL:      getEnv("REDIS_URL", "localhost:6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       0,
		},
		JWT: JWT{
			Secret:     getEnv("JWT_SECRET", "your-secret-key"),
			Expiration: jwtExpiration,
		},
		Google: Google{
			ClientID: getEnv("GOOGLE_CLIENT_ID", ""),
		},
		RateLimit: RateLimit{
			RequestsPerMinute: requestsPerMinute,
		},
		YahooFinance: YahooFinance{
			Enabled:         yahooEnabled,
			Timeout:         yahooTimeout,
			MaxRetries:      yahooMaxRetries,
			RetryDelay:      yahooRetryDelay,
			CacheMaxAge:     yahooCacheMaxAge,
			FallbackToStale: yahooFallbackToStale,
			RequestsPerMin:  yahooRequestsPerMin,
		},
	}

	// Validate configuration (skip validation in Vercel environment to allow graceful degradation)
	if os.Getenv("VERCEL") != "1" {
		if err := cfg.Validate(); err != nil {
			return nil, fmt.Errorf("invalid configuration: %w", err)
		}
	}

	return cfg, nil
}

// Validate validates the configuration.
func (c *Config) Validate() error {
	// Validate required fields
	if c.Database.Name == "" {
		return errors.New("database name is required")
	}
	if c.JWT.Secret == "" || c.JWT.Secret == "your-secret-key" || len(c.JWT.Secret) < 10 {
		return errors.New("JWT_SECRET must be set to a secure value (at least 10 characters)")
	}

	// Validate port number
	if c.Server.Port == "" {
		return errors.New("server port is required")
	}

	// Validate connection pool settings
	if c.Database.MaxOpenConns < 1 {
		return errors.New("DB_MAX_OPEN_CONNS must be at least 1")
	}
	if c.Database.MaxIdleConns < 0 {
		return errors.New("DB_MAX_IDLE_CONNS cannot be negative")
	}
	if c.Database.MaxIdleConns > c.Database.MaxOpenConns {
		return errors.New("DB_MAX_IDLE_CONNS cannot be greater than DB_MAX_OPEN_CONNS")
	}

	// Validate rate limit
	if c.RateLimit.RequestsPerMinute < 1 {
		return errors.New("RATE_LIMIT_REQUESTS_PER_MINUTE must be at least 1")
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
