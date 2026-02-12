# Bank Template Seed Data

This directory contains pre-built bank statement templates for Vietnamese banks.

## Available Templates

### 1. Vietcombank (VCB)
- **vcb_credit_card.json** - Credit card statements
- **vcb_checking.json** - Checking/savings account statements

**Features**:
- Date format: DD/MM/YYYY
- Amount: VND with comma thousands separator
- Supports CSV, Excel, PDF
- Vietnamese column names: "Ngày giao dịch", "Số tiền", "Nội dung"

### 2. Techcombank (TCB)
- **techcombank_credit_card.json** - Credit card statements

**Features**:
- Modern format with clear descriptions
- Negative amounts in parentheses: (150,000)
- Supports CSV, Excel, PDF
- Column names: "Ngày giao dịch", "Số tiền giao dịch", "Mô tả giao dịch"

### 3. Vietinbank (CTG)
- **vietinbank_credit_card.json** - Credit card statements

**Features**:
- Traditional state bank format
- Date format: DD/MM/YYYY
- Supports CSV, Excel, PDF
- Column names: "Ngày GD", "Số tiền", "Nội dung giao dịch"

### 4. ACB (Asia Commercial Bank)
- **acb_credit_card.json** - Credit card statements

**Features**:
- English column names: "Posting Date", "Amount", "Description"
- Modern private bank format
- Supports CSV, Excel (PDF not available from bank)

### 5. MB Bank (Military Bank)
- **mb_checking.json** - Checking/savings account statements

**Features**:
- Transaction type column: "Loại GD" (IN/OUT)
- Supports CSV, Excel
- Column names: "Ngày", "Số tiền", "Loại GD", "Nội dung"

## Template Structure

Each JSON file contains:

```json
{
  "id": "bank-type",
  "name": "Display Name",
  "bankCode": "BANK_CODE",
  "statementType": "credit|checking|debit",
  "fileFormats": ["csv", "excel", "pdf"],
  "columnMapping": {
    "dateColumn": ["Column Name 1", "Column Name 2"],
    "amountColumn": ["Column Name 1", "Column Name 2"],
    "descriptionColumn": ["Column Name 1", "Column Name 2"],
    "referenceColumn": ["Column Name 1", "Column Name 2"],
    "typeColumn": ["Column Name 1"]
  },
  "dateFormat": "DD/MM/YYYY",
  "amountFormat": {
    "decimalSeparator": ".",
    "thousandsSeparator": ",",
    "negativeFormat": "minus|parentheses|suffix",
    "currencySymbol": "VND"
  },
  "currency": "VND",
  "detectionRules": {
    "headerKeywords": ["Keywords in header"],
    "footerKeywords": ["Keywords in footer"],
    "skipPatterns": ["Regex patterns to skip"]
  },
  "typeRules": {
    "defaultType": "expense|income|null",
    "incomeKeywords": ["SALARY", "REFUND"],
    "expenseKeywords": ["PURCHASE", "PAYMENT"]
  }
}
```

## Loading Templates

Run the migration command to load all templates:

```bash
cd src/go-backend
go run cmd/migrate-templates/main.go
```

This will:
1. Read all JSON files from this directory
2. Parse and validate each template
3. Insert/update templates in the `bank_template` table
4. Skip duplicates (based on template ID)

## Testing Templates

Test each template with real bank statements:

```bash
# 1. Upload a statement file
curl -X POST http://localhost:8080/api/v1/import/upload \
  -F "file=@statement.csv"

# 2. List available templates
curl http://localhost:8080/api/v1/import/templates

# 3. Parse with template
curl -X POST http://localhost:8080/api/v1/import/parse \
  -d '{"fileId": "...", "bankTemplateId": "vcb-credit-card"}'
```

## Adding New Templates

To add a new bank template:

1. Create a JSON file: `{bank_code}_{statement_type}.json`
2. Fill in all required fields (see structure above)
3. Test with real statement files from the bank
4. Run migration to load into database
5. Update this README with template details

## Template Versioning

When a bank changes their statement format:
1. Create a new template with version suffix: `vcb-credit-card-v2.json`
2. Set `isActive: false` on the old template
3. Users can switch templates if needed

## Vietnamese Column Name Reference

Common column names used by Vietnamese banks:

| English | Vietnamese | Alternatives |
|---------|-----------|--------------|
| Transaction Date | Ngày giao dịch | Ngày GD, Ngày |
| Amount | Số tiền | Số tiền GD, Số tiền giao dịch |
| Description | Nội dung | Diễn giải, Mô tả, Chi tiết |
| Reference | Mã giao dịch | Số tham chiếu, Mã tham chiếu |
| Type | Loại GD | Ghi có/Ghi nợ |
| Debit | Ghi nợ | Nợ, D, OUT |
| Credit | Ghi có | Có, C, IN |
| Balance | Số dư | Số dư TK |

## Support

For questions or issues with templates:
- Check the business rules document: `docs/plans/2026-02-11-credit-card-statement-import-business-rules.md`
- Review parser implementations: `src/go-backend/pkg/parser/`
- Create an issue with sample statement file (redact sensitive data)
