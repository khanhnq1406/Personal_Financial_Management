package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// YahooFinanceAPICounter tracks the total number of Yahoo Finance API calls
// with labels for symbol and status (success, error, timeout)
var YahooFinanceAPICalls = promauto.NewCounterVec(
	prometheus.CounterOpts{
		Name: "yahoo_finance_api_calls_total",
		Help: "Total number of Yahoo Finance API calls",
	},
	[]string{"symbol", "status"}, // status: success, error, timeout
)

// YahooFinanceAPILatency tracks the latency of Yahoo Finance API calls
// in seconds with symbol label for breakdown by asset
var YahooFinanceAPILatency = promauto.NewHistogramVec(
	prometheus.HistogramOpts{
		Name:    "yahoo_finance_api_latency_seconds",
		Help:    "Yahoo Finance API call latency in seconds",
		Buckets: prometheus.DefBuckets,
	},
	[]string{"symbol"},
)

// YahooFinanceCacheHits tracks cache operations for Yahoo Finance data
// with labels for symbol and status (hit, miss, stale)
var YahooFinanceCacheHits = promauto.NewCounterVec(
	prometheus.CounterOpts{
		Name: "yahoo_finance_cache_hits_total",
		Help: "Total number of cache hits",
	},
	[]string{"symbol", "status"}, // status: hit, miss, stale
)