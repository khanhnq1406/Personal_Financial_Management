# Import Performance Indexes Migration

This migration adds database indexes to optimize the bank statement import feature.

## Indexes Created

### 1. idx_transaction_wallet_date_amount
```sql
CREATE INDEX IF NOT EXISTS idx_transaction_wallet_date_amount
ON transaction (wallet_id, date, amount);
```

**Purpose**: Optimizes duplicate detection queries for Level 2 and Level 3:
- Level 2: Same date + amount within 1-day range
- Level 3: Similar amount (±1%) within 1-day range

**Query Pattern**:
```sql
SELECT * FROM transaction
WHERE wallet_id = ?
  AND date >= ?
  AND date <= ?
  AND amount = ?
```

### 2. idx_transaction_wallet_external_id
```sql
CREATE INDEX IF NOT EXISTS idx_transaction_wallet_external_id
ON transaction (wallet_id, external_id);
```

**Purpose**: Optimizes Level 1 duplicate detection by external reference ID.

**Query Pattern**:
```sql
SELECT * FROM transaction
WHERE wallet_id = ?
  AND external_id = ?
```

## Running the Migration

From the project root:

```bash
cd src/go-backend
go run cmd/migrate-import-indexes/main.go
```

Or from the go-backend directory:

```bash
go run cmd/migrate-import-indexes/main.go
```

## Performance Impact

- **Duplicate Detection**: ~10-100x faster for large transaction histories
- **Bulk Import**: Significantly reduced query time during import validation
- **Index Size**: Minimal impact (~1-2% of table size)

## Rollback

If you need to remove these indexes:

```sql
DROP INDEX IF EXISTS idx_transaction_wallet_date_amount;
DROP INDEX IF EXISTS idx_transaction_wallet_external_id;
```

Note: This is safe to do at any time. The application will continue to function, just with slower duplicate detection queries.
