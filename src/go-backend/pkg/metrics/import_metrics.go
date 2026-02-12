package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// Import operation metrics

// ImportAttempts tracks the total number of import attempts by status and file type.
var ImportAttempts = promauto.NewCounterVec(
	prometheus.CounterOpts{
		Name: "import_attempts_total",
		Help: "Total number of import attempts",
	},
	[]string{"status", "file_type"}, // status: success, error, validation_failed; file_type: csv, excel, pdf
)

// ImportDuration tracks the time taken for various import operations.
var ImportDuration = promauto.NewHistogramVec(
	prometheus.HistogramOpts{
		Name:    "import_duration_seconds",
		Help:    "Duration of import operations in seconds",
		Buckets: []float64{0.1, 0.5, 1, 2, 5, 10, 30, 60}, // 0.1s to 60s
	},
	[]string{"operation"}, // operation: parse, duplicate_detection, execute, undo
)

// ImportTransactionCount tracks the number of transactions imported per batch.
var ImportTransactionCount = promauto.NewHistogram(
	prometheus.HistogramOpts{
		Name:    "import_transaction_count",
		Help:    "Number of transactions per import batch",
		Buckets: []float64{1, 10, 50, 100, 500, 1000, 5000, 10000},
	},
)

// DuplicateDetectionDuration tracks the time taken for duplicate detection.
var DuplicateDetectionDuration = promauto.NewHistogram(
	prometheus.HistogramOpts{
		Name:    "duplicate_detection_duration_seconds",
		Help:    "Duration of duplicate detection in seconds",
		Buckets: []float64{0.01, 0.05, 0.1, 0.5, 1, 2, 5}, // 10ms to 5s
	},
)

// DuplicatesFound tracks the number of duplicates found per import.
var DuplicatesFound = promauto.NewHistogram(
	prometheus.HistogramOpts{
		Name:    "duplicates_found_count",
		Help:    "Number of duplicate transactions found per import",
		Buckets: []float64{0, 1, 5, 10, 50, 100, 500},
	},
)

// FileUploadSize tracks uploaded file sizes in bytes.
var FileUploadSize = promauto.NewHistogramVec(
	prometheus.HistogramOpts{
		Name:    "file_upload_size_bytes",
		Help:    "Size of uploaded files in bytes",
		Buckets: []float64{1024, 10240, 102400, 1048576, 10485760, 20971520}, // 1KB to 20MB
	},
	[]string{"file_type"},
)

// CategorizationDuration tracks the time taken for auto-categorization.
var CategorizationDuration = promauto.NewHistogram(
	prometheus.HistogramOpts{
		Name:    "categorization_duration_seconds",
		Help:    "Duration of transaction categorization in seconds",
		Buckets: prometheus.DefBuckets,
	},
)

// CategorizationConfidence tracks the confidence scores of category suggestions.
var CategorizationConfidence = promauto.NewHistogram(
	prometheus.HistogramOpts{
		Name:    "categorization_confidence_score",
		Help:    "Confidence score of category suggestions (0-100)",
		Buckets: []float64{0, 20, 40, 60, 70, 80, 90, 95, 100},
	},
)

// CurrencyConversionCount tracks the number of transactions requiring currency conversion.
var CurrencyConversionCount = promauto.NewCounterVec(
	prometheus.CounterOpts{
		Name: "currency_conversion_total",
		Help: "Total number of currency conversions performed",
	},
	[]string{"from_currency", "to_currency", "source"}, // source: auto, manual
)

// BulkInsertBatchSize tracks the batch sizes used in bulk inserts.
var BulkInsertBatchSize = promauto.NewHistogram(
	prometheus.HistogramOpts{
		Name:    "bulk_insert_batch_size",
		Help:    "Number of transactions per bulk insert batch",
		Buckets: []float64{10, 50, 100, 200, 500, 1000},
	},
)
