package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"wealthjourney/domain/models"
	"wealthjourney/pkg/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Database struct {
	DB *gorm.DB
}

// New creates a new database connection with connection pooling
func New(cfg *config.Config) (*Database, error) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=require",
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Name,
	)

	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true, // Disable implicit prepared statement usage
	}), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		// Disable prepared statements for Supabase compatibility
		// Supabase uses PgBouncer which can have issues with prepared statements
		PrepareStmt: false,
		// Skip default transaction for better performance
		SkipDefaultTransaction: true,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Get underlying SQL DB to configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get SQL DB: %w", err)
	}

	// Configure connection pool
	sqlDB.SetMaxOpenConns(cfg.Database.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.Database.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(cfg.Database.ConnMaxLifetime)
	sqlDB.SetConnMaxIdleTime(cfg.Database.ConnMaxIdleTime)

	// Auto migrate schemas
	err = db.AutoMigrate(
		&models.User{},
		&models.Wallet{},
		&models.Category{},
		&models.Transaction{},
		&models.Budget{},
		&models.BudgetItem{},
		&models.Investment{},
		&models.InvestmentTransaction{},
		&models.InvestmentLot{},
		&models.MarketData{},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	// Run post-migration data backfills (idempotent)
	if err := runPostMigrations(db); err != nil {
		log.Printf("Warning: post-migration failed: %v", err)
		// Don't fail startup, just log the warning
	}

	log.Printf("Database connected and migrated successfully (pool: maxOpen=%d, maxIdle=%d)",
		cfg.Database.MaxOpenConns, cfg.Database.MaxIdleConns)

	return &Database{DB: db}, nil
}

// runPostMigrations executes data backfills and index creations after schema migration
// These are idempotent and safe to run on every startup
func runPostMigrations(db *gorm.DB) error {
	// 1. Create performance indexes (idempotent with IF NOT EXISTS)

	// Category composite index for type lookups
	if err := db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_category_user_type
		ON category(user_id, type)
	`).Error; err != nil {
		return fmt.Errorf("failed to create idx_category_user_type: %w", err)
	}

	// User email index for faster auth lookups (partial index on non-deleted records)
	if err := db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_user_email
		ON "user"(email)
		WHERE deleted_at IS NULL
	`).Error; err != nil {
		return fmt.Errorf("failed to create idx_user_email: %w", err)
	}

	// 2. Backfill gold investment purchase_unit values
	// Gold VND (type 8): default to tael display
	if err := db.Exec(`
		UPDATE investment
		SET purchase_unit = 'tael'
		WHERE type = 8 AND (purchase_unit IS NULL OR purchase_unit = 'gram')
	`).Error; err != nil {
		return fmt.Errorf("failed to backfill gold VND: %w", err)
	}

	// Gold USD (type 9): default to oz display
	if err := db.Exec(`
		UPDATE investment
		SET purchase_unit = 'oz'
		WHERE type = 9 AND (purchase_unit IS NULL OR purchase_unit = 'gram')
	`).Error; err != nil {
		return fmt.Errorf("failed to backfill gold USD: %w", err)
	}

	return nil
}

// Close closes the database connection
func (d *Database) Close() error {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// Ping checks if the database connection is alive
func (d *Database) Ping() error {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return sqlDB.PingContext(ctx)
}

// Stats returns database connection pool statistics
func (d *Database) Stats() map[string]interface{} {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return map[string]interface{}{
			"error": err.Error(),
		}
	}

	stats := sqlDB.Stats()
	return map[string]interface{}{
		"max_open_connections": stats.MaxOpenConnections,
		"open_connections":     stats.OpenConnections,
		"in_use":               stats.InUse,
		"idle":                 stats.Idle,
		"wait_count":           stats.WaitCount,
		"wait_duration":        stats.WaitDuration.String(),
		"max_idle_closed":      stats.MaxIdleClosed,
		"max_lifetime_closed":  stats.MaxLifetimeClosed,
	}
}
