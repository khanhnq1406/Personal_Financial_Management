package models

import (
	"time"

	"gorm.io/gorm"
)

type ImportBatch struct {
	ID               string         `gorm:"primaryKey;size:36" json:"id"` // UUID
	UserID           int32          `gorm:"not null;index" json:"userId"`
	WalletID         int32          `gorm:"not null;index" json:"walletId"`
	FileName         string         `gorm:"size:255" json:"fileName"`
	FileType         string         `gorm:"size:10" json:"fileType"` // csv, excel, pdf
	FileSize         int64          `json:"fileSize"`
	BankTemplate     string         `gorm:"size:50" json:"bankTemplate"` // Optional
	ImportedAt       time.Time      `json:"importedAt"`

	// Statistics
	TotalRows        int32          `json:"totalRows"`
	ValidRows        int32          `json:"validRows"`
	SkippedRows      int32          `json:"skippedRows"`
	DuplicatesMerged int32          `json:"duplicatesMerged"`
	DuplicatesSkipped int32         `json:"duplicatesSkipped"`

	// Financial summary (stored as smallest currency unit)
	TotalIncome      int64          `gorm:"type:bigint" json:"totalIncome"`
	TotalExpenses    int64          `gorm:"type:bigint" json:"totalExpenses"`
	NetChange        int64          `gorm:"type:bigint" json:"netChange"`

	// Date range
	DateRangeStart   time.Time      `json:"dateRangeStart"`
	DateRangeEnd     time.Time      `json:"dateRangeEnd"`

	// Undo support
	CanUndo          bool           `json:"canUndo"`
	UndoExpiresAt    time.Time      `json:"undoExpiresAt"`
	UndoneAt         *time.Time     `json:"undoneAt"`

	CreatedAt        time.Time      `json:"createdAt"`
	UpdatedAt        time.Time      `json:"updatedAt"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	User             *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Wallet           *Wallet        `gorm:"foreignKey:WalletID" json:"wallet,omitempty"`
}

func (ImportBatch) TableName() string {
	return "import_batch"
}
