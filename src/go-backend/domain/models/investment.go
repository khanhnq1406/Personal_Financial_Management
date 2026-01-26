package models

import (
	"time"

	v1 "wealthjourney/protobuf/v1"

	"gorm.io/gorm"
)

// Investment represents an individual investment holding within a wallet
type Investment struct {
	ID                   int32                        `gorm:"primaryKey;autoIncrement" json:"id"`
	WalletID             int32                        `gorm:"not null;index:idx_investment_wallet" json:"walletId"`
	Symbol               string                       `gorm:"size:20;not null;index" json:"symbol"`
	Name                 string                       `gorm:"size:100;not null" json:"name"`
	Type                 v1.InvestmentType            `gorm:"type:int;not null;default:0" json:"type"`
	Quantity             int64                        `gorm:"type:bigint;not null;default:0" json:"quantity"`
	AverageCost          int64                        `gorm:"type:bigint;not null;default:0" json:"averageCost"`
	TotalCost            int64                        `gorm:"type:bigint;not null;default:0" json:"totalCost"`
	Currency             string                       `gorm:"size:3;not null;default:'USD'" json:"currency"`
	CurrentPrice         int64                        `gorm:"type:bigint;default:0" json:"currentPrice"`
	CurrentValue         int64                        `gorm:"type:bigint;default:0" json:"currentValue"`
	UnrealizedPNL        int64                        `gorm:"type:bigint;default:0" json:"unrealizedPnl"`
	UnrealizedPNLPercent float64                      `gorm:"type:double;default:0" json:"unrealizedPnlPercent"`
	RealizedPNL          int64                        `gorm:"type:bigint;default:0" json:"realizedPnl"`
	CreatedAt            time.Time                    `json:"createdAt"`
	UpdatedAt            time.Time                    `json:"updatedAt"`
	DeletedAt            gorm.DeletedAt               `gorm:"index" json:"-"`

	// Relationships
	Wallet               *Wallet                      `gorm:"foreignKey:WalletID" json:"wallet,omitempty"`
}

// TableName specifies the table name for Investment model
func (Investment) TableName() string {
	return "investment"
}

// BeforeUpdate GORM hook to recalculate derived fields
func (i *Investment) BeforeUpdate(tx *gorm.DB) error {
	i.recalculate()
	return nil
}

// recalculate updates CurrentValue, UnrealizedPNL, UnrealizedPNLPercent
func (i *Investment) recalculate() {
	if i.Quantity > 0 && i.CurrentPrice > 0 {
		// CurrentValue = (Quantity * CurrentPrice) / decimals
		// For crypto: satoshis (8 decimals) - divide by 100000000
		// For stocks: 4 decimal places - divide by 10000
		// We use 100000000 as the base divisor for consistency
		i.CurrentValue = (i.Quantity * i.CurrentPrice) / 100000000

		i.UnrealizedPNL = i.CurrentValue - i.TotalCost
		if i.TotalCost > 0 {
			i.UnrealizedPNLPercent = (float64(i.UnrealizedPNL) / float64(i.TotalCost)) * 100
		}
	} else if i.TotalCost > 0 {
		// If quantity or price is zero, unrealized PNL is -100%
		i.UnrealizedPNL = -i.TotalCost
		i.UnrealizedPNLPercent = -100.0
	}
}

// ToProto converts the model to protobuf message
func (i *Investment) ToProto() *v1.Investment {
	return &v1.Investment{
		Id:                   i.ID,
		WalletId:             i.WalletID,
		Symbol:               i.Symbol,
		Name:                 i.Name,
		Type:                 i.Type,
		Quantity:             i.Quantity,
		AverageCost:          i.AverageCost,
		TotalCost:            i.TotalCost,
		Currency:             i.Currency,
		CurrentPrice:         i.CurrentPrice,
		CurrentValue:         i.CurrentValue,
		UnrealizedPnl:        i.UnrealizedPNL,
		UnrealizedPnlPercent: i.UnrealizedPNLPercent,
		RealizedPnl:          i.RealizedPNL,
		CreatedAt:            i.CreatedAt.Unix(),
		UpdatedAt:            i.UpdatedAt.Unix(),
	}
}
