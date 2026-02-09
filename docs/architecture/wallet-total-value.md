# Wallet Total Value Display

## Overview

The wallet balance system displays different values based on context:
- **Total Value** = Available Cash + Current Investment Value (for INVESTMENT wallets)
- **Available Cash** = Spendable balance (used in transaction forms)

## Backend Architecture

### Protobuf Fields

**Wallet message:**
- `balance`: Available cash in smallest currency unit
- `investmentValue`: Current value of all holdings
- `totalValue`: balance + investmentValue
- `displayBalance`, `displayInvestmentValue`, `displayTotalValue`: Converted to user's preferred currency

**GetTotalBalanceResponse:**
- `data`: Total cash across all wallets
- `totalInvestments`: Sum of all investment values
- `netWorth`: data + totalInvestments
- `displayValue`, `displayTotalInvestments`, `displayNetWorth`: Converted values

### Caching Strategy

- Investment values cached in Redis with 5-minute TTL
- Cache key: `wallet:{walletID}:investment_value`
- Invalidated on: CreateInvestment, AddTransaction, UpdatePrices, DeleteInvestment

### Performance

- Batch fetching: `GetInvestmentValuesByWalletIDs` for multiple wallets
- Single query: `SELECT wallet_id, SUM(current_value) FROM investment WHERE wallet_id IN (...) GROUP BY wallet_id`

## Frontend Display Rules

| Context | Display | Component |
|---------|---------|-----------|
| Home Dashboard - Total Balance | Net Worth (cash + investments) | TotalBalance.tsx |
| Home Dashboard - Wallet List | Total Value for INVESTMENT, Balance for BASIC | Walllets.tsx |
| Wallets Page - Wallet Cards | Total Value with progress bar (INVESTMENT only) | WalletCard.tsx |
| Transaction Forms | Available Cash only | AddTransactionForm.tsx |
| Investment Forms | Available Cash only | AddInvestmentForm.tsx |
| Portfolio Page | Both values side-by-side | portfolio/page.tsx |

## Implementation Details

See [2026-01-30-wallet-total-value-display.md](../../plans/2026-01-30-wallet-total-value-display.md) for detailed implementation steps.
