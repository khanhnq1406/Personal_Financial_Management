# Credit Card Statement Import - Business Rules Requirements

**Document Version**: 1.0
**Date**: 2026-02-11
**Feature**: Credit Card Statement Import (Category 3.2)
**Author**: WealthJourney Product Team

---

## Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [User Flow](#2-user-flow)
3. [File Format Support](#3-file-format-support)
4. [Bank Template System](#4-bank-template-system)
5. [Parsing Rules](#5-parsing-rules)
6. [Data Validation](#6-data-validation)
7. [Duplicate Detection & Handling](#7-duplicate-detection--handling)
8. [Transaction Categorization](#8-transaction-categorization)
9. [Currency Conversion](#9-currency-conversion)
10. [Review & Confirmation Flow](#10-review--confirmation-flow)
11. [Import Execution](#11-import-execution)
12. [Error Handling](#12-error-handling)
13. [Security & Privacy](#13-security--privacy)
14. [Performance Requirements](#14-performance-requirements)
15. [Analytics & Metrics](#15-analytics--metrics)

---

## 1. Feature Overview

### 1.1 Purpose

Enable users to bulk import transactions from bank/credit card statements in CSV, Excel, or PDF formats to reduce manual entry burden, improve tracking consistency, and accelerate onboarding.

### 1.2 Target Use Cases

| Use Case | Description | User Behavior | Success Metric |
|----------|-------------|---------------|----------------|
| **Quick Monthly Reconciliation** | Users upload monthly statements to identify and fill gaps in manual tracking | Upload 1 statement per month, review duplicates, import missing transactions | Import completes in <3 minutes, <5% duplicate false positives |
| **Bulk Onboarding** | New users import 3-6 months of historical data to quickly populate their account | Upload 3-6 files at once, batch-categorize, quick review | Import 500+ transactions in <10 minutes |
| **Primary Tracking Method** | Users rely on monthly imports as their main expense tracking approach | Upload statement monthly, minimal manual entry | 80%+ of transactions come from imports |

### 1.3 Business Value

- **Reduce user churn**: Address the #1 pain point (forgetting to enter transactions after 2-3 weeks)
- **Increase data completeness**: Capture 90%+ of user transactions vs 30-40% with manual-only
- **Accelerate onboarding**: New users get value in minutes vs days/weeks
- **Competitive parity**: Match feature set of Mint, YNAB (industry standard)

### 1.4 Success Criteria

- 60%+ of active users try import feature within 30 days of launch
- 80%+ success rate on first import attempt
- Average import time <5 minutes for 100 transactions
- Duplicate detection accuracy >95%
- User satisfaction score >4.0/5.0

---

## 2. User Flow

### 2.1 High-Level Flow

```
1. Upload File → 2. Select Bank/Format → 3. Parse & Validate → 4. Review & Fix
→ 5. Handle Duplicates → 6. Confirm Import → 7. Import Complete
```

### 2.2 Detailed Step-by-Step Flow

#### Step 1: Upload File

**Entry Points**:
- Dashboard home page: "Import Transactions" button (primary CTA)
- Transaction list page: "Import" action in header
- Empty state: "Get started by importing your bank statement" (first-time users)

**User Actions**:
1. Click "Import Transactions" button
2. Modal/page opens with file upload area
3. User drags file or clicks "Browse" to select file
4. System validates file type and size
5. If valid, proceed to Step 2; if invalid, show error

**UI Requirements**:
- Drag-and-drop file upload area (desktop)
- File picker (mobile)
- Supported formats clearly labeled: "CSV, Excel (.xlsx, .xls), PDF"
- File size limit shown: "Max 10MB for CSV/Excel, 20MB for PDF"
- Loading indicator during file upload

#### Step 2: Select Bank/Format

**Bank Template Selection**:
- Show dropdown: "Select your bank" with options:
  - Pre-built templates (VCB, Vietinbank, Techcombank, ACB, MB Bank, etc.)
  - "Custom format" (opens column mapping UI)
- If PDF: Show additional option "Statement type" (credit card vs checking account)

**Column Mapping UI** (for custom format):
- Show preview of first 5 rows from uploaded file
- Dropdown for each required field:
  - Date (required)
  - Amount (required)
  - Description/Merchant (required)
  - Transaction Type (optional - Income/Expense)
  - Category (optional)
  - Reference Number (optional)
- "Save as template" option to reuse mapping for future imports

**Validation**:
- Required fields must be mapped
- Date column must contain valid dates
- Amount column must contain numbers

#### Step 3: Parse & Validate

**Parsing Logic**:
1. Apply bank template rules or user-defined column mapping
2. Extract transaction rows (skip headers, footers, summary rows)
3. Parse each field according to data type rules (see Section 5)
4. Validate each transaction (see Section 6)
5. Detect potential duplicates (see Section 7)
6. Auto-categorize transactions (see Section 8)
7. Handle currency conversion if needed (see Section 9)

**Progress Indicator**:
- Show parsing progress: "Parsing 245 transactions... 60%"
- Estimated time remaining
- Cancellable during parsing

#### Step 4: Review & Fix

**Grouped Review Screen** (See Section 10 for details):

```
Import Review: 245 transactions from statement.csv

Target Wallet: [My Checking Account ▼]

[⚠️] 8 Need Fixes                          [Expand ▼]
     Must fix before import

[!] 5 Potential Duplicates                 [Expand ▼]
    Review to avoid duplicate entries

[?] 12 Need Category Review                [Expand ▼]
    Low confidence (<80%) - please verify

[✓] 220 Ready to Import                    [View All ▶]
    High confidence, auto-categorized

Date Range: Jan 1, 2026 - Jan 31, 2026     [Filter ▼]

[Cancel] [Import 220 Now] [Review All]
```

**Inline Fix UI**:
- Errors shown with red border and error message
- Inline edit fields for Date, Amount, Description
- Click to edit, auto-save on blur
- Real-time validation as user types

#### Step 5: Handle Duplicates

**Duplicate Handling Strategy Selection**:

User chooses one strategy for this import:

1. **Auto-merge exact matches** (Recommended for monthly imports)
   - Merge transactions with exact same: Wallet, Amount, Date (same day)
   - Update existing transaction if imported one has more details
   - Show count: "5 duplicates will be merged automatically"

2. **Review each duplicate** (Recommended for first-time imports)
   - Show side-by-side comparison for each potential duplicate
   - User chooses: "Merge", "Keep both", "Skip import"
   - Fuzzy matching: Same wallet, amount, date ±1 day

3. **Keep all as new transactions** (Use when sure no duplicates exist)
   - Import all transactions even if potential duplicates detected
   - User can manually delete duplicates later

4. **Skip all duplicates** (Conservative approach)
   - Don't import any transactions that might be duplicates
   - Safe but may miss legitimate transactions

**Duplicate Review UI** (if option 2 selected):

```
Duplicate Review (5 potential matches)

Transaction #1 of 5

Imported Transaction:          Existing Transaction:
Amount:    ₫150,000            Amount:    ₫150,000
Date:      Jan 15, 2026        Date:      Jan 15, 2026
Merchant:  HIGHLANDS COFFEE    Description: Coffee
Category:  (not set)           Category:  Dining > Coffee
Wallet:    Checking Account    Wallet:    Checking Account

[Merge - Keep existing] [Keep both] [Skip import] [Cancel]
```

#### Step 6: Confirm Import

**Summary Screen**:
```
Ready to Import

✓ 220 transactions will be imported
⚠ 8 transactions need fixes (can't import yet)
↔ 5 duplicates will be merged
✗ 12 transactions excluded by date filter

Target Wallet: My Checking Account
Date Range: Jan 1-31, 2026
Total Amount: +₫15,000,000 (income), -₫28,500,000 (expenses)

Currency Conversions:
- 12 USD transactions → VND at rate 23,500 (auto)
- 3 EUR transactions → VND at rate 25,800 (manual)

[Go Back] [Confirm Import]
```

**Final Confirmation**:
- Clear summary of what will happen
- Show impact on wallet balance
- One-click undo available for 24 hours after import

#### Step 7: Import Complete

**Success Screen**:
```
✓ Import Complete!

Successfully imported 220 transactions

Summary:
- Income: 15 transactions (+₫15,000,000)
- Expenses: 205 transactions (-₫28,500,000)
- Net Change: -₫13,500,000

New Wallet Balance: ₫5,450,000

[View Transactions] [Import Another File] [Done]
```

**Post-Import Actions**:
- Update wallet balance
- Refresh transaction list
- Invalidate relevant caches
- Log import event for analytics
- Show success notification

---

## 3. File Format Support

### 3.1 CSV Files

**Supported Encodings**:
- UTF-8 (preferred)
- UTF-16
- Windows-1252 (Vietnamese banking standard)
- Auto-detect encoding using BOM or heuristics

**Format Requirements**:
- Delimiter: Comma (`,`) or semicolon (`;`) - auto-detect
- Quote character: Double quote (`"`)
- Line ending: CRLF (`\r\n`) or LF (`\n`)
- Header row: Optional (if present, must be first row)

**Structure**:
```csv
Date,Description,Amount,Type
01/01/2026,STARBUCKS COFFEE,150000,Expense
02/01/2026,SALARY PAYMENT,15000000,Income
```

**Validation Rules**:
- Must have at least 3 columns (Date, Amount, Description minimum)
- Maximum 10,000 rows
- Maximum file size: 10MB
- Each row must have same number of columns

**Edge Cases**:
- Empty rows: Skip silently
- Comments (rows starting with `#`): Skip
- Summary rows (keywords: "Total", "Balance", "Summary"): Skip
- Merged cells: Treat as single cell with merged value

### 3.2 Excel Files

**Supported Versions**:
- `.xlsx` (Excel 2007+) - preferred
- `.xls` (Excel 97-2003) - legacy support

**Format Requirements**:
- Multi-sheet support: If multiple sheets, use first sheet or prompt user to select
- Named ranges: Support named ranges for transaction data (e.g., "Transactions")
- Formulas: Evaluate formulas to their calculated values

**Structure**:
- Similar to CSV, tabular data with columns
- Support formatted cells (currency, date formats)
- Ignore hidden rows/columns
- Support filtered data (show only visible rows)

**Validation Rules**:
- Maximum 10,000 rows per sheet
- Maximum file size: 10MB
- Must not be password-protected
- Corrupt file detection and rejection

**Edge Cases**:
- Empty sheets: Skip and try next sheet
- Charts/images: Ignore
- Pivot tables: Extract source data if available
- Merged cells: Use top-left cell value

### 3.3 PDF Files

**Supported Types**:
- Text-based PDFs (selectable text) - preferred
- Image-based PDFs (scanned statements) - requires OCR

**Parsing Strategy**:
1. **Text Extraction** (for text-based PDFs):
   - Extract text using PDF parser (e.g., pdfplumber, PyPDF2)
   - Identify table structures using whitespace analysis
   - Extract rows and columns based on alignment

2. **OCR Processing** (for image-based PDFs):
   - Use OCR engine (Tesseract, AWS Textract, Google Vision API)
   - Pre-process images (deskew, enhance contrast)
   - Extract text with confidence scores
   - Flag low-confidence extractions for user review

**Format Requirements**:
- Maximum 50 pages
- Maximum file size: 20MB
- Minimum resolution: 150 DPI for scanned PDFs
- Supported layouts: Tabular format with clear columns

**Validation Rules**:
- Must contain at least 1 transaction table
- Date and amount columns must be identifiable
- Skip header/footer content (logo, page numbers, disclaimers)

**Edge Cases**:
- Multi-page statements: Combine transactions from all pages
- Page breaks mid-table: Reconstruct table across pages
- Non-tabular text: Attempt to extract using pattern matching
- Low OCR confidence (<80%): Flag entire transaction for user review

**Performance Optimization**:
- Process PDFs asynchronously (background job)
- Cache extracted data for 1 hour
- Limit concurrent PDF processing to 5 per server

---

## 4. Bank Template System

### 4.1 Template Structure

Each bank template defines:

```typescript
interface BankTemplate {
  id: string;                    // e.g., "vcb-credit-card"
  name: string;                  // e.g., "Vietcombank Credit Card"
  bankCode: string;              // e.g., "VCB"
  statementType: "credit" | "debit" | "checking";
  fileFormats: ["csv", "excel", "pdf"];

  // Column mapping
  columns: {
    date: string | string[];          // Column name(s) for date
    amount: string | string[];        // Column name(s) for amount
    description: string | string[];   // Column name(s) for merchant/description
    transactionType?: string;         // Optional: Income/Expense indicator
    category?: string;                // Optional: Category name
    referenceNumber?: string;         // Optional: Transaction ID
  };

  // Parsing rules
  dateFormat: string;            // e.g., "DD/MM/YYYY"
  amountFormat: {
    decimalSeparator: "." | ",";
    thousandsSeparator: "," | "." | " " | "";
    negativeFormat: "parentheses" | "minus" | "suffix";  // e.g., (1000), -1000, 1000-
  };
  currency: string;              // Default currency (e.g., "VND")

  // Detection rules (for auto-detection)
  detectionRules: {
    headers: string[];           // Expected column headers
    footerKeywords: string[];    // Keywords that indicate end of transactions
    skipPatterns: RegExp[];      // Patterns to skip (summary rows, etc.)
  };

  // Transaction type detection
  typeRules?: {
    incomeKeywords: string[];    // e.g., ["SALARY", "REFUND", "DEPOSIT"]
    expenseKeywords: string[];   // e.g., ["PURCHASE", "WITHDRAWAL", "PAYMENT"]
    typeColumn?: string;         // Column that explicitly states type
  };
}
```

### 4.2 Pre-Built Templates

**Phase 1 Launch (5 templates)**:

1. **Vietcombank (VCB)**:
   - Credit Card Statement (CSV/Excel/PDF)
   - Checking Account Statement (CSV/Excel/PDF)

2. **Techcombank**:
   - Credit Card Statement (CSV/Excel/PDF)

3. **Vietinbank**:
   - Credit Card Statement (CSV/Excel/PDF)

4. **ACB (Asia Commercial Bank)**:
   - Credit Card Statement (CSV/Excel)

5. **MB Bank (Military Bank)**:
   - Checking Account Statement (CSV/Excel)

**Template Selection Strategy**:
- Based on usage analytics from "Custom format" users
- Survey top-requested banks
- Cover ~80% of Vietnamese banking market share

### 4.3 Custom Format Mapping

**When user selects "Custom format"**:

1. **Auto-Detection Attempt**:
   - Analyze column headers to guess field types
   - Check first 10 rows for data patterns
   - Suggest mappings with confidence scores
   - Example: Column "Ngày giao dịch" → Date (95% confident)

2. **Manual Mapping UI**:
   ```
   Map Your Statement Columns

   Preview of your file:
   [Table showing first 5 rows]

   Required Fields:
   Date →           [Select column ▼] Ngày giao dịch
   Amount →         [Select column ▼] Số tiền
   Description →    [Select column ▼] Nội dung

   Optional Fields:
   Transaction Type → [Select column ▼] (none)
   Category →         [Select column ▼] (none)
   Reference # →      [Select column ▼] Mã GD

   Date Format:     [DD/MM/YYYY ▼]
   Currency:        [VND ▼]

   Amount Format:
   ☑ Negative = Expense, Positive = Income
   ☐ Separate column for type

   [Save as Template for Future] Template Name: [_______]

   [Cancel] [Next: Preview]
   ```

3. **Save Template** (optional):
   - User can save custom mapping for reuse
   - Template stored per user (not global)
   - Template name required (e.g., "My Agribank CSV")
   - Can edit/delete saved templates in settings

### 4.4 Template Management

**Admin Functions**:
- Add new bank templates via admin panel
- Edit existing templates
- Enable/disable templates per region
- Track template usage analytics

**User Functions**:
- View saved custom templates
- Edit custom templates
- Delete custom templates
- Share template with other users (future feature)

---

## 5. Parsing Rules

### 5.1 Date Parsing

**Supported Formats**:
- `DD/MM/YYYY` (Vietnamese standard) - e.g., 31/12/2026
- `MM/DD/YYYY` (US standard) - e.g., 12/31/2026
- `YYYY-MM-DD` (ISO 8601) - e.g., 2026-12-31
- `DD-MM-YYYY` - e.g., 31-12-2026
- `DD MMM YYYY` - e.g., 31 Dec 2026
- `DD/MM/YY` (2-digit year) - e.g., 31/12/26
- Unix timestamp (seconds) - e.g., 1735689600

**Parsing Logic**:
1. Try bank template date format first
2. If fails, try common formats in order above
3. If still fails, use date parsing library (e.g., date-fns, moment.js)
4. If ambiguous (e.g., 01/02/2026 could be Jan 2 or Feb 1), use template default
5. If all fail, flag as validation error

**Validation Rules**:
- Date must not be in the future (allow up to +1 day for timezone tolerance)
- Date must not be older than 10 years
- Date must be within reasonable range for statement (warn if >1 year old)

**Edge Cases**:
- Empty date: Validation error (required field)
- Invalid date (e.g., 32/01/2026): Validation error
- Timezone handling: All dates stored as UTC midnight
- Daylight saving time: Ignored (use date only, no time component)

### 5.2 Amount Parsing

**Input Formats**:
- Plain number: `150000` or `150000.50`
- Thousands separator: `150,000` or `150.000` (European)
- Currency symbol: `₫150,000` or `$150.00`
- Negative indicators:
  - Minus sign: `-150000` or `150000-`
  - Parentheses: `(150000)`
  - Red color (Excel): Detect via cell formatting

**Parsing Logic**:
1. Strip currency symbols and whitespace
2. Detect decimal separator (`.` or `,`)
3. Detect thousands separator (`,`, `.`, or space)
4. Remove thousands separators
5. Replace decimal separator with `.`
6. Parse as float, convert to integer (multiply by 10,000 for 4 decimal precision)
7. Apply sign based on negative indicator

**Example Transformations**:
```
Input          → Parsed       → Stored (int64)
"150,000"      → 150000       → 1500000000 (150000 × 10000)
"(1,500.50)"   → -1500.50     → -15005000
"₫2.500,75"    → 2500.75      → 25007500 (European format)
"$42.00"       → 42.00        → 420000
```

**Validation Rules**:
- Amount must not be zero (or allow zero for memo transactions?)
- Amount must be reasonable (< 10 billion VND or equivalent)
- Negative amounts:
  - If no type column: Treat as expense
  - If type column specifies: Follow type column
  - If contradicts type: Flag for user review

**Edge Cases**:
- Empty amount: Validation error (required field)
- Non-numeric characters: Try to extract numbers, else validation error
- Multiple decimal points: Flag as validation error
- Very large numbers: Warn user (possible data error)

### 5.3 Description/Merchant Parsing

**Input Handling**:
- Plain text: Use as-is
- Multi-line: Combine into single line (replace newlines with spaces)
- Special characters: Preserve (e.g., "McDonald's", "Café Phở")
- HTML entities: Decode (e.g., `&amp;` → `&`)

**Cleaning Rules**:
1. Trim leading/trailing whitespace
2. Normalize multiple spaces to single space
3. Remove common bank prefixes: "PURCHASE AT ", "PAYMENT TO ", "POS ", "ATM "
4. Remove transaction codes/IDs embedded in description (e.g., "STARBUCKS REF:12345")
5. Capitalize properly: "STARBUCKS COFFEE" → "Starbucks Coffee"

**Validation Rules**:
- Description must not be empty (or use placeholder like "Transaction")
- Maximum length: 500 characters
- Minimum length: 2 characters

**Merchant Extraction**:
- Extract merchant name for categorization
- Pattern: `MERCHANT_NAME LOCATION_CODE` → Extract `MERCHANT_NAME`
- Example: "GRAB*VIET NAM HCM" → "Grab"

**Edge Cases**:
- Empty description: Use "Imported Transaction" as default
- Very long descriptions: Truncate to 500 chars, append "..."
- Special characters causing issues: Replace with ASCII equivalents

### 5.4 Transaction Type Detection

**Detection Methods**:

1. **Explicit Type Column**:
   - Column values: "Income", "Expense", "Credit", "Debit", etc.
   - Map to standard types: INCOME, EXPENSE

2. **Amount Sign**:
   - Positive amount = Income (or Debit for credit cards)
   - Negative amount = Expense (or Credit for credit cards)
   - Depends on statement type (credit vs debit card)

3. **Keyword Matching**:
   - Income keywords: SALARY, REFUND, DEPOSIT, TRANSFER IN, INTEREST
   - Expense keywords: PURCHASE, WITHDRAWAL, PAYMENT, TRANSFER OUT, FEE

4. **Template Rules**:
   - Bank-specific rules (e.g., VCB credit card: all are expenses by default)

**Priority Order**:
1. Explicit type column (highest priority)
2. Template rules
3. Keyword matching
4. Amount sign (fallback)

**Validation**:
- If conflicting signals (e.g., positive amount but "PURCHASE" keyword), flag for review
- If unknown type, default to EXPENSE and flag for review

### 5.5 Category Detection (Auto-Categorization)

**See Section 8 for detailed rules**

### 5.6 Reference Number Extraction

**Purpose**: Track original transaction IDs for reconciliation and duplicate detection

**Extraction Logic**:
- If reference number column exists: Use directly
- If embedded in description: Extract using patterns
  - Pattern 1: "REF: 12345", "REF#12345"
  - Pattern 2: "TRACE#67890"
  - Pattern 3: "AUTH:ABCDEF"

**Validation**:
- Optional field (can be empty)
- Maximum length: 100 characters
- Store as-is for future reference

**Usage**:
- Duplicate detection (exact reference match = likely duplicate)
- User support (find transaction by reference number)
- Reconciliation with bank statements

---

## 6. Data Validation

### 6.1 Pre-Import Validation

**All transactions validated before showing review screen**:

| Field | Validation Rule | Error Message | Severity |
|-------|----------------|---------------|----------|
| Date | Not empty | "Date is required" | Error |
| Date | Valid date format | "Invalid date format. Expected DD/MM/YYYY" | Error |
| Date | Not in future | "Date cannot be in the future" | Error |
| Date | Not too old | "Date is older than 10 years. Please verify." | Warning |
| Amount | Not empty | "Amount is required" | Error |
| Amount | Valid number | "Amount must be a valid number" | Error |
| Amount | Not zero | "Amount cannot be zero" | Error (or Warning?) |
| Amount | Reasonable range | "Amount is very large (>1B). Please verify." | Warning |
| Description | Not empty | "Description is required" | Error |
| Description | Length 2-500 | "Description must be 2-500 characters" | Error |
| Currency | Valid ISO code | "Invalid currency code" | Error |
| Wallet | Exists | "Wallet not found" | Error |
| Wallet | Not deleted | "Wallet is deleted" | Error |
| Category | Valid ID | "Category not found" | Warning |

**Validation Levels**:
- **Error**: Blocks import, must be fixed
- **Warning**: Allows import but shows warning message
- **Info**: Informational message, doesn't block import

### 6.2 Inline Fix UI

**For transactions with errors**:

```
Row 45: Invalid date "32/01/2026"
┌─────────────────────────────────────────┐
│ Date:        [31/01/2026        ] ← Edit │
│ Amount:      ₫150,000            ✓       │
│ Description: Starbucks Coffee    ✓       │
│ Category:    Dining > Coffee     ✓       │
└─────────────────────────────────────────┘
[Fix] [Skip This Transaction]
```

**Features**:
- Click field to edit inline
- Real-time validation as user types
- Auto-save on blur or Enter key
- Show validation status icon (✓ ✗ ⚠)

### 6.3 Batch Validation

**Performance Optimization**:
- Validate in chunks of 100 transactions
- Show progress: "Validating 245 transactions... 60%"
- Cancel button during validation
- Timeout after 60 seconds (show partial results)

**Error Summary**:
```
Validation Results

✓ 220 transactions valid
✗ 8 transactions have errors
⚠ 17 transactions have warnings

[Fix 8 Errors] [Review 17 Warnings] [Import Valid Only]
```

---

## 7. Duplicate Detection & Handling

### 7.1 Duplicate Detection Algorithm

**Matching Criteria** (in priority order):

**Level 1: Exact Match** (99% confidence)
- Same wallet ID
- Same amount (exact)
- Same date (exact day)
- Same reference number (if available)

**Level 2: Strong Match** (90-95% confidence)
- Same wallet ID
- Same amount (exact)
- Date within ±1 day
- Description similarity >80% (Levenshtein distance)

**Level 3: Likely Match** (70-85% confidence)
- Same wallet ID
- Amount within ±5% (e.g., 150,000 vs 157,500 due to rounding)
- Date within ±3 days
- Description similarity >60%

**Level 4: Possible Match** (50-65% confidence)
- Same wallet ID
- Amount within ±10%
- Date within ±7 days
- Merchant name match (extracted from description)

**Non-Match Criteria** (skip duplicate check):
- Different wallet
- Amount differs by >10%
- Date differs by >7 days
- One is income, other is expense

### 7.2 Duplicate Handling Strategies

**Strategy 1: Auto-merge exact matches** (Recommended for monthly imports)

**Behavior**:
- Automatically merge Level 1 matches (99% confidence)
- Flag Level 2-4 for user review
- Update existing transaction with imported data if more complete
- Preserve user edits (don't overwrite manually edited fields)

**Merge Logic**:
```
Existing:        Amount: ₫150,000, Date: Jan 15, Description: "Coffee"
Imported:        Amount: ₫150,000, Date: Jan 15, Description: "Starbucks Coffee #123"

Merged Result:   Amount: ₫150,000, Date: Jan 15, Description: "Starbucks Coffee #123"
                 (Use more detailed description from import)
```

**Strategy 2: Review each duplicate** (Recommended for first-time imports)

**Behavior**:
- Show side-by-side comparison for all matches (Level 1-4)
- User chooses action for each:
  - **Merge**: Update existing transaction with imported data
  - **Keep both**: Import as new transaction (useful for similar legitimate transactions)
  - **Skip import**: Don't import this transaction
  - **Not a duplicate**: Mark as false positive, import as new

**Review UI**:
```
Duplicate Review (5 potential matches)

Match Confidence: 95% (Strong Match)

Imported Transaction:          Existing Transaction:
Amount:    ₫150,000            Amount:    ₫150,000
Date:      Jan 15, 2026        Date:      Jan 15, 2026
Merchant:  STARBUCKS COFFEE    Description: Coffee
Category:  (not set)           Category:  Dining > Coffee
Wallet:    Checking            Wallet:    Checking
Reference: 123456              Reference: (none)

Why matched: Same wallet, amount, date (exact)

[← Previous] [Next →] (1 of 5)

[Merge] [Keep Both] [Skip Import] [Not a Duplicate]
```

**Strategy 3: Keep all as new transactions**

**Behavior**:
- Import all transactions even if potential duplicates detected
- Show warning count: "5 potential duplicates will be imported"
- User can manually delete duplicates later from transaction list

**Use Case**: User is confident no duplicates exist (e.g., importing from new account)

**Strategy 4: Skip all duplicates**

**Behavior**:
- Don't import any transactions with confidence >50%
- Conservative approach to avoid duplicates
- Show skipped count: "5 potential duplicates skipped"

**Use Case**: User wants to be extra safe, doesn't mind missing some transactions

### 7.3 Duplicate Detection Performance

**Optimization**:
- Index existing transactions by (wallet_id, date, amount)
- Only check transactions within ±7 days of import date range
- Limit to 1000 most recent transactions per wallet
- Use fuzzy matching library (e.g., fuzzywuzzy) for description similarity

**Expected Performance**:
- 100 imports checking against 1000 existing: <2 seconds
- 500 imports checking against 5000 existing: <10 seconds

---

## 8. Transaction Categorization

### 8.1 Auto-Categorization Logic

**Goal**: Automatically suggest categories with confidence scores, user reviews low-confidence suggestions.

**Categorization Methods** (in priority order):

1. **Exact Merchant Match**:
   - Merchant database: Map known merchant names to categories
   - Example: "STARBUCKS" → Dining > Coffee (100% confidence)
   - Example: "GRAB" → Transportation > Ride-sharing (100% confidence)

2. **User History Learning**:
   - If user previously categorized "HIGHLANDS COFFEE" as Dining > Coffee
   - Future "HIGHLANDS COFFEE" transactions auto-suggest same category (95% confidence)
   - Learn from user corrections during import review

3. **Keyword Matching**:
   - Description contains keywords → Suggest category
   - Example: "TAXI", "GRAB" → Transportation (80% confidence)
   - Example: "PHARMACY", "DRUG" → Healthcare (80% confidence)

4. **Machine Learning Model** (Future Phase):
   - Train model on user's transaction history
   - Predict category based on description, amount, date patterns
   - Confidence score from model output

### 8.2 Merchant Database

**Structure**:
```typescript
interface MerchantRule {
  merchantPattern: string;        // e.g., "STARBUCKS*", "GRAB*"
  matchType: "exact" | "prefix" | "contains" | "regex";
  category: {
    id: number;
    name: string;                 // e.g., "Dining > Coffee"
  };
  confidence: number;             // 0-100
  region?: string;                // e.g., "VN" (Vietnam-specific)
}
```

**Vietnamese Merchant Examples**:
```json
[
  { "pattern": "HIGHLANDS COFFEE*", "matchType": "prefix", "category": "Dining > Coffee", "confidence": 100 },
  { "pattern": "GRAB*", "matchType": "prefix", "category": "Transportation > Ride-sharing", "confidence": 100 },
  { "pattern": "CIRCLE K*", "matchType": "prefix", "category": "Shopping > Convenience Store", "confidence": 95 },
  { "pattern": "VINMART*", "matchType": "prefix", "category": "Shopping > Groceries", "confidence": 95 },
  { "pattern": "*PHAM NGOC THACH*", "matchType": "contains", "category": "Healthcare > Hospital", "confidence": 85 },
  { "pattern": "SHOPEE*", "matchType": "prefix", "category": "Shopping > Online", "confidence": 90 }
]
```

**Database Maintenance**:
- Admin can add/edit merchant rules
- User can contribute merchant mappings (crowdsourced)
- Periodic review and cleanup (remove low-usage rules)

### 8.3 Keyword-Based Categorization

**Category Keywords** (Vietnamese + English):

| Category | Vietnamese Keywords | English Keywords | Confidence |
|----------|---------------------|------------------|------------|
| Dining > Restaurant | nhà hàng, quán ăn, phở, bún, cơm | restaurant, diner, bistro, eatery | 75% |
| Dining > Coffee | cà phê, coffee, cafe | coffee, cafe, espresso | 80% |
| Transportation | xe ôm, taxi, xe buýt, vé xe | taxi, bus, uber, lyft, grab | 85% |
| Shopping > Groceries | siêu thị, chợ, thực phẩm | supermarket, grocery, mart | 80% |
| Healthcare | bệnh viện, phòng khám, thuốc | hospital, clinic, pharmacy, doctor | 85% |
| Utilities | điện, nước, gas, internet, điện thoại | electricity, water, gas, internet, phone | 90% |
| Entertainment | rạp phim, cinema, game, vui chơi | cinema, movie, game, entertainment | 75% |

**Keyword Matching Logic**:
1. Normalize description: Remove diacritics, lowercase
2. Check if any keyword appears in description
3. If match, suggest category with confidence score
4. If multiple matches, choose highest confidence
5. If tie, prefer more specific category (Coffee > Dining)

### 8.4 Learning from User Corrections

**Behavior**:
- When user changes auto-suggested category during review
- Store mapping: (merchant/description pattern, user_id, category_id)
- Future imports: Use user's preference (95% confidence)
- Gradually improve accuracy per user

**Example Flow**:
1. Import: "CIRCLE K NGUYEN HUE" → Auto-suggests "Shopping > Convenience Store"
2. User changes to: "Dining > Snacks"
3. Next import: "CIRCLE K DISTRICT 1" → Auto-suggests "Dining > Snacks" (learned)

**Privacy**:
- User learning data stored per user (not shared globally)
- Option to "Reset learning" in settings

### 8.5 Category Review UI

**In Import Review Screen**:

```
[?] 12 Need Category Review (Expand ▼)

Row 23: CIRCLE K NGUYEN HUE
Amount: ₫45,000
Suggested: Shopping > Convenience Store (75% confidence)
[Change Category ▼]

Row 45: UNKNOWN MERCHANT
Amount: ₫120,000
Suggested: (No suggestion)
[Select Category ▼]

Bulk Actions:
[Accept All Suggestions] [Mark All as Uncategorized]
```

**Category Dropdown**:
- Hierarchical category selector
- Search/filter categories
- Show recent categories first
- "Create new category" option

---

## 9. Currency Conversion

### 9.1 Multi-Currency Detection

**Detection Logic**:
1. Parse currency from statement file:
   - Currency column (if exists)
   - Currency symbol in amount field (₫, $, €, £)
   - Bank template default currency
2. If no currency detected, assume wallet's currency

**Mixed Currency Handling**:
- If statement has transactions in multiple currencies (e.g., 90% VND, 10% USD)
- Group by currency in review screen
- Apply conversion per currency group

### 9.2 Exchange Rate Fetching

**Rate Sources** (in priority order):

1. **Historical FX API** (Primary):
   - API: exchangerate-api.io or xe.com API
   - Fetch historical rate for transaction date
   - Cache rates in database (TTL: 7 days)
   - Example: For Jan 15, 2026 transaction, fetch USD→VND rate on Jan 15, 2026

2. **Latest Rate** (Fallback):
   - If historical rate unavailable (API down, old date)
   - Use latest available rate
   - Show warning: "Using latest rate (historical rate unavailable)"

3. **Manual Entry** (User Override):
   - User can always override auto-fetched rate
   - Useful for bank-specific rates or cash exchanges

**Rate Caching Strategy**:
- Cache rates by (from_currency, to_currency, date)
- TTL: 7 days for historical rates, 1 hour for latest rate
- Invalidate cache on user manual override (for that specific import only)

### 9.3 Conversion UI

**Currency Conversion Screen**:

```
Currency Conversion Required

Target Wallet: My Checking Account (VND)

Found 12 transactions in USD:
┌────────────────────────────────────────────────────┐
│ Exchange Rate: USD → VND                           │
│                                                    │
│ Rate: 23,500 VND per 1 USD                        │
│ Source: exchangerate-api.io (Jan 15, 2026)        │
│                                                    │
│ [Use This Rate] [Enter Custom Rate: _______]      │
│                                                    │
│ Preview:                                           │
│ • $42.00 → ₫987,000 (Row 23)                      │
│ • $15.50 → ₫364,250 (Row 45)                      │
│ • $120.00 → ₫2,820,000 (Row 67)                   │
│ ...                                                │
│                                                    │
│ Total: $1,245.00 → ₫29,257,500                    │
└────────────────────────────────────────────────────┘

[Back] [Apply Conversion]
```

**Custom Rate Entry**:
- Manual input field
- Validation: Must be positive number
- Preview updates in real-time
- Show difference from auto-fetched rate: "+2.3% higher"

### 9.4 Conversion Logic

**Formula**:
```
Stored Amount (int64) = Original Amount (float) × Exchange Rate × 10,000

Example:
$42.00 USD → VND (rate: 23,500)
= 42 × 23,500 = 987,000 VND
= 987,000 × 10,000 = 9,870,000,000 (stored as int64)
```

**Rounding**:
- Round to nearest whole number for VND (no decimals)
- Preserve 2 decimals for USD, EUR
- Preserve 4 decimals for crypto (future)

**Batch Conversion**:
- Apply same rate to all transactions in same currency
- If user overrides rate, apply to all
- Store original currency and rate for reference

### 9.5 Multi-Currency Summary

**In Import Confirmation Screen**:

```
Currency Conversions Applied:

USD → VND (23,500 rate, auto):
  12 transactions, Total: $1,245.00 → ₫29,257,500

EUR → VND (25,800 rate, manual):
  3 transactions, Total: €87.50 → ₫2,257,500

[View Conversion Details] [Change Rates]
```

**Conversion Details Stored**:
- Original amount and currency
- Exchange rate used
- Rate source (auto/manual)
- Converted amount in wallet currency
- Conversion date

---

## 10. Review & Confirmation Flow

### 10.1 Grouped Review Screen

**Layout**:

```
┌─────────────────────────────────────────────────────────┐
│ Import Review                                           │
│ 245 transactions from vcb_statement_jan_2026.csv        │
│                                                         │
│ Target Wallet: [My Checking Account ▼]                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [⚠️] 8 Need Fixes                        [Expand ▼]   │
│      Must fix before import                            │
│                                                         │
│ [!] 5 Potential Duplicates               [Expand ▼]   │
│     Review to avoid duplicate entries                  │
│                                                         │
│ [?] 12 Need Category Review              [Expand ▼]   │
│     Low confidence (<80%) - please verify              │
│                                                         │
│ [💱] 15 Currency Conversions              [Review]     │
│      USD, EUR → VND                                    │
│                                                         │
│ [✓] 205 Ready to Import                  [View All ▶] │
│     High confidence, auto-categorized                  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Date Range: Jan 1, 2026 - Jan 31, 2026  [Filter ▼]   │
│                                                         │
│ [Cancel] [Import 205 Now] [Review All Transactions]   │
└─────────────────────────────────────────────────────────┘
```

**Group Priorities**:
1. **Needs Fixes** (blocking): Must resolve before import
2. **Potential Duplicates**: Should review to avoid issues
3. **Need Category Review**: Optional but recommended
4. **Currency Conversions**: Review rates
5. **Ready to Import**: Can collapse/expand for quick view

### 10.2 Expandable Sections

**"Need Fixes" Section** (expanded):

```
[⚠️] 8 Need Fixes (Expand ▲)

Row 45: Invalid date
┌─────────────────────────────────────────────────────┐
│ Date:        [32/01/2026    ] ❌ Invalid date       │
│              Fix: [31/01/2026] ✓                     │
│ Amount:      ₫150,000          ✓                     │
│ Description: Starbucks Coffee  ✓                     │
└─────────────────────────────────────────────────────┘
[Fix] [Skip This Row]

Row 67: Amount is zero
┌─────────────────────────────────────────────────────┐
│ Date:        Jan 15, 2026      ✓                     │
│ Amount:      [0        ] ❌ Cannot be zero           │
│              Fix: [______]                           │
│ Description: UNKNOWN MERCHANT  ✓                     │
└─────────────────────────────────────────────────────┘
[Fix] [Skip This Row]

... (6 more)

[Fix All] [Skip All 8]
```

**"Potential Duplicates" Section** (expanded):

```
[!] 5 Potential Duplicates (Expand ▲)

Match 1 of 5: 95% confidence (Strong Match)
┌─────────────────────────────────────────────────────┐
│ Imported:                 Existing:                  │
│ ₫150,000                  ₫150,000                  │
│ Jan 15, 2026              Jan 15, 2026              │
│ STARBUCKS COFFEE          Coffee                    │
│ (not categorized)         Dining > Coffee           │
│ Ref: 123456               (no ref)                  │
└─────────────────────────────────────────────────────┘
[Merge] [Keep Both] [Skip Import]

... (4 more)

[Review All] [Auto-Merge All]
```

### 10.3 Date Range Filter

**Filter UI**:

```
Date Range Filter

From: [01/01/2026 📅] To: [31/01/2026 📅]

Quick Filters:
[Last 7 Days] [Last 30 Days] [This Month] [Last Month] [Custom]

Transactions in range: 220 of 245
Excluded: 25 transactions outside date range

[Apply Filter] [Clear Filter]
```

**Behavior**:
- Exclude transactions outside selected range
- Show excluded count
- Excluded transactions not imported
- Quick filters for common ranges

### 10.4 Individual Transaction Exclusion

**Checkbox Selection**:

```
[✓] 205 Ready to Import (View All ▶)

┌─────────────────────────────────────────────────────┐
│ [☑] Jan 15 • ₫150,000 • Starbucks Coffee            │
│ [☑] Jan 15 • ₫45,000 • Circle K                     │
│ [☐] Jan 16 • ₫1,200,000 • Unknown Merchant          │ ← Unchecked
│ [☑] Jan 16 • ₫85,000 • Grab Ride                    │
│ ... (201 more)                                      │
└─────────────────────────────────────────────────────┘

Selected: 204 of 205

[Select All] [Deselect All] [Import Selected]
```

**Bulk Actions**:
- Select/deselect all in current group
- Select/deselect by criteria (e.g., all >1M VND)
- Keyboard shortcuts: Ctrl+A (select all), Space (toggle)

### 10.5 Final Confirmation Screen

**Summary Before Import**:

```
┌─────────────────────────────────────────────────────┐
│ Ready to Import                                     │
│                                                     │
│ ✓ 205 transactions will be imported                │
│ ⚠ 8 transactions skipped (had errors)              │
│ ↔ 5 duplicates will be merged                      │
│ ✗ 27 transactions excluded by filters              │
│                                                     │
│ Target Wallet: My Checking Account                 │
│ Date Range: Jan 1-31, 2026                         │
│                                                     │
│ Summary:                                            │
│ • Income: 15 transactions (+₫15,000,000)          │
│ • Expenses: 190 transactions (-₫28,500,000)       │
│ • Net Change: -₫13,500,000                        │
│                                                     │
│ New Wallet Balance: ₫5,450,000                    │
│   (Current: ₫18,950,000)                           │
│                                                     │
│ Currency Conversions:                              │
│ • 12 USD → VND (rate: 23,500, auto)               │
│ • 3 EUR → VND (rate: 25,800, manual)              │
│                                                     │
│ [Go Back] [Confirm Import]                         │
└─────────────────────────────────────────────────────┘
```

**Confirmation Safeguards**:
- Show clear impact on wallet balance
- Highlight large/unusual amounts
- One-click undo available after import (24 hours)
- "Are you sure?" if balance becomes negative

---

## 11. Import Execution

### 11.1 Import Process

**Backend Flow**:

1. **Pre-Import Validation**:
   - Verify wallet exists and active
   - Verify user owns wallet
   - Check for sufficient permissions
   - Validate all transactions one final time

2. **Database Transaction**:
   - Use database transaction (ACID properties)
   - If any insert fails, rollback all
   - Prevents partial imports

3. **Create Transactions**:
   - Bulk insert for performance (batch of 100)
   - Set wallet_id, user_id, category_id, etc.
   - Store original currency and conversion rate (if applicable)
   - Store import metadata (source file, import date, batch ID)

4. **Update Wallet Balance**:
   - Calculate total income - expenses
   - Update wallet balance atomically
   - If balance update fails, rollback transaction creates

5. **Handle Duplicates**:
   - If auto-merge: Update existing transactions
   - If skip: Don't insert duplicates
   - Store duplicate detection metadata

6. **Post-Import Actions**:
   - Invalidate relevant caches (wallet balance, transaction list)
   - Trigger analytics event
   - Send notification (if enabled)
   - Store import history for audit

### 11.2 Performance Optimization

**Bulk Insert Strategy**:
```sql
INSERT INTO transaction (wallet_id, amount, date, description, ...)
VALUES
  (1, 1500000000, '2026-01-15', 'Starbucks Coffee', ...),
  (1, 450000000, '2026-01-15', 'Circle K', ...),
  ... (100 rows per batch)
```

**Batch Size**:
- 100 transactions per INSERT statement
- Process in chunks to avoid memory issues
- Show progress: "Importing... 150/245 (61%)"

**Expected Performance**:
- 100 transactions: ~2 seconds
- 500 transactions: ~8 seconds
- 1000 transactions: ~15 seconds

**Timeout**:
- Import timeout: 120 seconds
- If timeout, rollback and show partial progress
- User can retry with smaller date range

### 11.3 Import Metadata Storage

**Store Import History**:

```typescript
interface ImportBatch {
  id: string;                    // UUID
  userId: number;
  walletId: number;
  fileName: string;
  fileType: "csv" | "excel" | "pdf";
  fileSize: number;              // bytes
  bankTemplate?: string;         // e.g., "vcb-credit-card"
  importedAt: Date;

  // Statistics
  totalRows: number;             // Total rows in file
  validRows: number;             // Successfully imported
  skippedRows: number;           // Errors or excluded
  duplicatesMerged: number;
  duplicatesSkipped: number;

  // Financial summary
  totalIncome: number;           // Amount in wallet currency
  totalExpenses: number;
  netChange: number;

  // Metadata
  dateRange: { from: Date; to: Date };
  currencyConversions?: Array<{
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    transactionCount: number;
  }>;

  // Reference to created transactions
  transactionIds: number[];

  // Undo support
  canUndo: boolean;
  undoneAt?: Date;
}
```

**Storage**:
- Store in `import_batch` table
- Link transactions to batch via `import_batch_id` foreign key
- Retain history for 90 days (compliance/audit)

### 11.4 Success Response

**API Response**:

```json
{
  "success": true,
  "importId": "batch-123e4567-e89b-12d3-a456-426614174000",
  "summary": {
    "totalImported": 205,
    "totalSkipped": 8,
    "duplicatesMerged": 5,
    "duplicatesSkipped": 0,
    "totalIncome": 15000000000,
    "totalExpenses": 28500000000,
    "netChange": -13500000000,
    "newWalletBalance": 5450000000
  },
  "transactions": [
    { "id": 1001, "amount": 1500000000, "date": "2026-01-15T00:00:00Z", ... },
    ...
  ],
  "canUndo": true,
  "undoExpiresAt": "2026-02-12T10:30:00Z"
}
```

### 11.5 Undo Functionality

**24-Hour Undo Window**:

**Feature**:
- Allow users to undo import within 24 hours
- Soft-delete imported transactions
- Revert wallet balance
- Restore pre-import state

**Implementation**:
1. Mark transactions with `import_batch_id`
2. Store pre-import wallet balance
3. On undo:
   - Soft-delete all transactions in batch
   - Restore wallet balance
   - Mark import batch as `undone`
4. After 24 hours:
   - Disable undo button
   - Transactions become permanent

**UI**:
```
Import Complete! ✓

205 transactions imported successfully.

[View Transactions] [Undo Import] [Done]

⏱ You can undo this import within 24 hours.
```

---

## 12. Error Handling

### 12.1 File Upload Errors

| Error | Cause | User Message | Action |
|-------|-------|--------------|--------|
| Invalid file type | User uploaded .docx, .txt, etc. | "Invalid file type. Please upload CSV, Excel, or PDF." | Show supported formats |
| File too large | Exceeds size limit | "File is too large. Max size: 10MB for CSV/Excel, 20MB for PDF." | Suggest splitting file |
| Corrupted file | Can't parse file | "File is corrupted or unreadable. Please re-download and try again." | Retry with valid file |
| Password-protected | Excel/PDF has password | "File is password-protected. Please remove password and try again." | Provide instructions |
| Empty file | No transaction data | "File is empty or contains no transaction data." | Upload correct file |

### 12.2 Parsing Errors

| Error | Cause | User Message | Action |
|-------|-------|--------------|--------|
| No transactions found | No valid rows detected | "No transactions found in file. Please check file format." | Show expected format |
| All rows invalid | Every row failed validation | "All transactions are invalid. Please check data format." | Show sample valid row |
| Column mapping failed | Can't auto-detect columns | "Unable to detect columns. Please use custom mapping." | Open mapping UI |
| Encoding error | Non-UTF-8 characters | "File encoding not supported. Please save as UTF-8." | Provide instructions |

### 12.3 Validation Errors

**Inline Error Messages** (see Section 6.2)

**Bulk Validation Failure**:
```
Validation Failed

8 transactions have errors that prevent import:
• Row 45: Invalid date "32/01/2026"
• Row 67: Amount is zero
• Row 89: Description too long (567 characters)
... (5 more)

[Fix Errors] [Skip Invalid Rows] [Cancel]
```

### 12.4 Import Execution Errors

| Error | Cause | User Message | Recovery |
|-------|-------|--------------|----------|
| Database error | DB connection lost | "Import failed due to technical issue. Please try again." | Retry import |
| Wallet not found | Wallet deleted during import | "Wallet no longer exists. Please select another wallet." | Select different wallet |
| Insufficient permissions | User lost access | "You don't have permission to import to this wallet." | Contact admin |
| Timeout | Import took >120s | "Import timed out. Try importing fewer transactions at once." | Split into smaller batches |
| Duplicate key error | Race condition | "Duplicate transaction detected. Please refresh and try again." | Refresh and retry |

### 12.5 Error Recovery

**Auto-Retry Logic**:
- Transient errors (network, timeout): Auto-retry 3 times with exponential backoff
- Permanent errors (validation, permission): Don't retry, show error message

**Partial Import Prevention**:
- Use database transactions (all-or-nothing)
- If any transaction fails, rollback entire batch
- Prevents inconsistent state

**Error Logging**:
- Log all errors to server (for debugging)
- Include: User ID, file name, error message, stack trace
- Privacy: Don't log sensitive financial data

---

## 13. Security & Privacy

### 13.1 File Upload Security

**Validation**:
- Check MIME type and file extension match
- Scan for malicious content (virus scan)
- Limit file size to prevent DoS
- Validate file structure before processing

**Storage**:
- Store uploaded files temporarily (1 hour max)
- Store in isolated directory with no execute permissions
- Delete after successful import or timeout
- Encrypt at rest (AES-256)

**Access Control**:
- Only authenticated users can upload
- User can only import to their own wallets
- Rate limiting: Max 10 imports per hour per user

### 13.2 Data Privacy

**Sensitive Data Handling**:
- Bank account numbers: Mask in UI (show last 4 digits only)
- Transaction descriptions: Store as-is, don't share with third parties
- File data: Delete original file after import (retain only parsed transactions)

**Compliance**:
- GDPR: User can export/delete all imported data
- PCI DSS: Don't store credit card numbers or CVV
- Data retention: Import history retained 90 days, then purged

### 13.3 API Security

**Authentication**:
- Require valid JWT token for all import endpoints
- Token must have `import:transactions` permission
- Refresh token if expired during long import

**Authorization**:
- Verify user owns target wallet
- Check wallet is not deleted or archived
- Audit log all import actions

**Rate Limiting**:
- Per user: 10 imports per hour
- Per IP: 50 imports per hour (prevent abuse)
- Per wallet: 20 imports per day (prevent spam)

### 13.4 Audit Trail

**Log Import Events**:
```typescript
{
  userId: 123,
  walletId: 456,
  action: "IMPORT_TRANSACTIONS",
  importBatchId: "batch-uuid",
  fileName: "vcb_statement_jan_2026.csv",
  transactionCount: 205,
  timestamp: "2026-02-11T10:30:00Z",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0..."
}
```

**Retention**: 1 year for audit purposes

---

## 14. Performance Requirements

### 14.1 Response Time Targets

| Operation | Target | Maximum |
|-----------|--------|---------|
| File upload | <2s for 10MB | <5s |
| Parsing (100 rows) | <1s | <3s |
| Parsing (1000 rows) | <5s | <15s |
| Validation (100 rows) | <500ms | <2s |
| Duplicate detection (100 rows) | <1s | <3s |
| Import execution (100 rows) | <2s | <5s |
| Import execution (1000 rows) | <15s | <30s |
| Total end-to-end (100 rows) | <1min | <3min |

### 14.2 Scalability

**Concurrent Users**:
- Support 100 concurrent imports
- Queue system for high load (Redis queue)
- Show estimated wait time if queued

**Large Imports**:
- Max 10,000 transactions per import
- For larger files, prompt user to split
- Background job processing for >500 transactions

### 14.3 Caching Strategy

**What to Cache**:
- Bank templates (Redis, 1 day TTL)
- Merchant database (Redis, 1 hour TTL)
- Exchange rates (Redis, 7 days TTL for historical)
- User category mappings (Redis, 1 hour TTL)

**Cache Invalidation**:
- On template update: Invalidate all templates
- On user category change: Invalidate user's mappings
- On exchange rate update: Invalidate specific rate

---

## 15. Analytics & Metrics

### 15.1 Key Metrics to Track

**Usage Metrics**:
- Import attempts (total, success, failure)
- Import success rate (%)
- Average transactions per import
- File format distribution (CSV, Excel, PDF)
- Bank template usage (which templates most used)

**Performance Metrics**:
- Average import duration
- 95th percentile import duration
- Error rate by error type
- Timeout rate

**Quality Metrics**:
- Duplicate detection accuracy (false positives, false negatives)
- Auto-categorization accuracy (% accepted vs changed)
- Validation error rate (% rows with errors)

**User Behavior**:
- % users who try import feature
- Average imports per user per month
- Undo rate (% of imports undone)
- Drop-off rate by step (upload, parse, review, confirm)

### 15.2 Event Tracking

**Events to Log**:

1. `import_started`: User clicked "Import Transactions"
2. `file_uploaded`: File successfully uploaded
3. `bank_template_selected`: User selected bank or custom mapping
4. `parsing_completed`: File parsing finished
5. `validation_completed`: All transactions validated
6. `review_screen_viewed`: User reached review screen
7. `duplicate_strategy_selected`: User chose duplicate handling strategy
8. `category_changed`: User manually changed auto-suggested category
9. `import_confirmed`: User clicked "Confirm Import"
10. `import_succeeded`: Import completed successfully
11. `import_failed`: Import failed with error
12. `import_undone`: User undid import within 24 hours

**Event Properties**:
- User ID
- Wallet ID
- File type (csv, excel, pdf)
- Bank template (if used)
- Transaction count
- Duplicate count
- Error count
- Duration (timestamp between steps)

### 15.3 A/B Testing Opportunities

**Test Variations**:
1. **Duplicate detection threshold**: 80% vs 90% vs 95% similarity
2. **Default duplicate strategy**: Auto-merge vs Review each
3. **Category confidence threshold**: Show review for <70% vs <80% vs <90%
4. **Review screen layout**: Grouped vs Flat list vs Spreadsheet
5. **Undo window**: 24 hours vs 7 days vs Permanent

**Success Metrics**:
- Import completion rate (% who finish vs abandon)
- Time to complete import
- User satisfaction score (post-import survey)
- Repeat usage rate (% who import again within 30 days)

---

## Appendix A: Vietnamese Banking Context

### Major Banks in Vietnam

1. **Vietcombank (VCB)** - State-owned, largest by assets
2. **Vietinbank** - State-owned, second largest
3. **BIDV** - State-owned
4. **Techcombank** - Private, tech-focused
5. **ACB (Asia Commercial Bank)** - Private
6. **MB Bank (Military Bank)** - State-owned
7. **VPBank** - Private
8. **Sacombank** - Private
9. **Agribank** - State-owned, agricultural focus
10. **TPBank** - Private

### Common Statement Formats

**CSV Format** (Most banks):
```csv
Ngày GD,Số tiền,Nội dung,Số dư
15/01/2026,150000,STARBUCKS COFFEE,5450000
```

**Excel Format** (VCB, Techcombank):
- Similar to CSV, with formatted cells
- Often includes bank logo and header

**PDF Format** (Most banks):
- Tabular layout with transaction details
- Often includes account summary, charts

### Vietnamese Financial Conventions

**Date Format**: DD/MM/YYYY (European style)
**Currency**: VND (Vietnam Dong), symbol ₫
**Amount Format**:
- Thousands separator: `.` (e.g., 1.000.000)
- Or: `,` (e.g., 1,000,000) for international format
**Negative Amounts**: Usually shown with `-` prefix or `()` parentheses

---

## Appendix B: Open Questions / Future Enhancements

### Phase 2 Features

1. **Bank API Integration** (Open Banking):
   - Direct connection to bank accounts
   - Auto-sync transactions daily
   - Replaces manual statement import

2. **Email Receipt Parsing**:
   - Connect Gmail/Outlook
   - Parse transaction emails from banks
   - Auto-import without file upload

3. **Mobile App Statement Capture**:
   - Take photo of paper statement
   - OCR extraction on device
   - Quick import flow

4. **Smart Categorization ML Model**:
   - Train on user's transaction history
   - Predict categories with high accuracy
   - Continuous learning from user corrections

5. **Multi-User Import**:
   - Share statement with family members
   - Split transactions across multiple wallets
   - Joint account support

6. **Scheduled Imports**:
   - Auto-download statement from bank website
   - Schedule monthly imports
   - Email notification when ready to review

### Technical Debt / Improvements

1. **Performance Optimization**:
   - Implement background job queue (Bull, Bee-Queue)
   - Use streaming parser for large files
   - Optimize duplicate detection algorithm

2. **Better Error Messages**:
   - Localization (Vietnamese language support)
   - Context-specific help articles
   - Inline troubleshooting tips

3. **Advanced Duplicate Detection**:
   - Machine learning model for fuzzy matching
   - Learn from user's "Not a duplicate" feedback
   - Adjust confidence thresholds dynamically

4. **Import Templates Marketplace**:
   - Users can share custom templates
   - Community-contributed bank templates
   - Rating and review system

---

## Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-11 | WealthJourney Team | Initial draft based on brainstorming session |

---

**End of Document**
