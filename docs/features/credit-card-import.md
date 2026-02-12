# Credit Card Statement Import

## Overview

Import transactions in bulk from your bank or credit card statements to save time and improve tracking accuracy. This feature allows you to quickly add multiple transactions at once instead of entering them one by one.

**Key Benefits:**
- **Save Time**: Import hundreds of transactions in minutes
- **Improve Accuracy**: Use exact amounts and dates from your bank
- **Catch Up Fast**: Easily get back on track after missing entries
- **No Manual Entry**: Eliminate tedious data entry work

## Supported Formats

The import feature supports multiple file formats from your bank:

| Format | File Extensions | Max Size | Notes |
|--------|----------------|----------|-------|
| **CSV** | `.csv` | 10 MB | Most common format, fastest processing |
| **Excel** | `.xlsx`, `.xls` | 10 MB | Both old and new Excel formats |
| **PDF** | `.pdf` | 20 MB | Extracted text must be structured |

**Note**: All files are processed securely and deleted after parsing. We never store your original statement files.

## How to Import

### Step 1: Navigate to Import

1. Go to the **Transactions** page in your dashboard
2. Click the **Import** button in the top-right corner
3. The import wizard will open

### Step 2: Upload Your File

1. Click **Choose File** or drag and drop your statement
2. Supported formats: CSV, Excel (.xlsx, .xls), or PDF
3. The file will be automatically validated and parsed
4. You'll see a preview of detected transactions

**Tips:**
- Use CSV format for best results and fastest parsing
- Ensure your file contains transaction data (not summary pages)
- If using PDF, make sure text is selectable (not scanned images)

### Step 3: Select Bank Template

Choose how to map your file's columns to transaction fields:

**Option A: Use a Bank Template** (Recommended)
- Select your bank from the dropdown
- Pre-configured mapping for common Vietnamese banks
- Click **Next** to proceed

**Option B: Custom Mapping**
- Select "Custom Mapping" if your bank isn't listed
- Map your file's columns to: Date, Amount, Description, Category (optional)
- Preview will update as you configure

**Available Bank Templates:**
- **Vietcombank Credit Card** - VCB credit card statements
- **Techcombank Credit Card** - TCB credit card statements
- More banks coming soon!

### Step 4: Review Transactions

1. Review the parsed transactions in the table
2. **Check for duplicates**: Yellow warning badges indicate potential duplicates
3. **Select transactions**: Use checkboxes to choose which to import
4. **Edit if needed**: Click any transaction to adjust details
5. Verify the total impact on your wallet balance

**Duplicate Detection:**
The system automatically flags potential duplicates based on:
- Exact match: Same reference ID (90-100% confidence)
- High match: Same date + amount + description (70-90% confidence)
- Medium match: Similar amount + close date (50-70% confidence)
- Low match: Similar description only (30-50% confidence)

**Review Tips:**
- Uncheck duplicates to avoid importing them twice
- Verify transaction dates are correct
- Check that amounts match your statement
- Ensure wallet balance won't go negative

### Step 5: Import

1. Review the summary at the bottom
2. Click **Import X Transactions**
3. Wait for confirmation (usually 1-3 seconds for 100 transactions)
4. Success screen will show import summary and undo option

## Undo Functionality

Made a mistake? You can undo your import easily.

**How to Undo:**
1. After import, click **Undo Import** on the success screen
2. Or go to Transaction history and find the import batch
3. Click **Undo** next to the import record
4. Confirm the undo action

**What Happens:**
- All imported transactions are deleted
- Wallet balance is restored to pre-import state
- Operation cannot be reversed after undo
- Undo option expires after **24 hours**

**Limitations:**
- You have 24 hours to undo after import
- Cannot undo if you've already edited imported transactions
- Cannot partially undo (it's all or nothing)

## Limitations & Constraints

Be aware of these system limits:

| Limit | Value | Reason |
|-------|-------|--------|
| **Max transactions per file** | 10,000 | Performance and memory limits |
| **Max file size (CSV/Excel)** | 10 MB | Processing speed |
| **Max file size (PDF)** | 20 MB | Text extraction overhead |
| **Date range** | Last 10 years | Prevents data errors |
| **Future dates** | Not allowed | Cannot import future transactions |
| **Rate limit** | 10 imports/hour | Prevent abuse |
| **Undo window** | 24 hours | Balance integrity |

## Troubleshooting

### File Upload Issues

**"File too large"**
- **Solution**: Split your statement into smaller files (by month or quarter)
- **Alternative**: Export as CSV instead of Excel/PDF (smaller file size)

**"Unsupported file format"**
- **Solution**: Ensure file has correct extension (.csv, .xlsx, .xls, .pdf)
- **Check**: File isn't corrupted (try opening it first)

**"File upload failed"**
- **Solution**: Check your internet connection and try again
- **Alternative**: Try a different browser or disable browser extensions

### Parsing Issues

**"No transactions found"**
- **Cause**: File doesn't contain expected data structure
- **Solution**:
  - Open file and verify it has transaction rows (not just summary)
  - Try using bank template instead of custom mapping
  - Ensure columns have headers

**"Invalid date format"**
- **Cause**: Dates aren't in recognized format
- **Solution**: Dates should be in one of these formats:
  - DD/MM/YYYY (e.g., 15/01/2026)
  - MM/DD/YYYY (e.g., 01/15/2026)
  - YYYY-MM-DD (e.g., 2026-01-15)
- **Fix**: Edit CSV file to use standard date format

**"Invalid amount"**
- **Cause**: Amounts contain special characters or wrong format
- **Solution**:
  - Remove currency symbols (₫, $, etc.)
  - Use period (.) for decimal, not comma
  - Ensure negative amounts have minus sign (-)

### Import Issues

**"Insufficient balance"**
- **Cause**: Import would make wallet balance negative
- **Solution**:
  - Uncheck some expense transactions
  - Add funds to your wallet first
  - Import in smaller batches

**"Rate limit exceeded"**
- **Cause**: More than 10 imports in one hour
- **Solution**: Wait 60 minutes before trying again
- **Why**: Prevents system overload

**"Transaction already exists"**
- **Cause**: High confidence duplicate detected
- **Solution**:
  - Check transaction history
  - Uncheck duplicates before importing
  - System prevents importing exact duplicates

### Review Stage Issues

**"All transactions flagged as duplicates"**
- **Cause**: You may have already imported this file
- **Solution**: Check transaction history for previous import
- **Action**: Uncheck all and cancel import

**"Can't select certain transactions"**
- **Cause**: Validation errors (date out of range, invalid data)
- **Solution**: Hover over disabled checkbox to see error message
- **Fix**: Edit transaction to correct the issue

## Best Practices

### Before Importing

1. **Download fresh statement**: Use the most recent statement from your bank
2. **Check date range**: Ensure you haven't already imported these dates
3. **Verify file format**: CSV is fastest and most reliable
4. **Review manually first**: Glance at the file to spot obvious errors

### During Import

1. **Use bank templates**: Pre-configured mappings are more accurate
2. **Review duplicates**: Always check flagged transactions
3. **Verify totals**: Ensure balance change matches expectations
4. **Test with small batch**: Try 10-20 transactions first if unsure

### After Import

1. **Review immediately**: Check transactions imported correctly
2. **Save undo option**: Bookmark success page if you need to undo later
3. **Categorize**: Imported transactions may need category adjustments
4. **Reconcile balance**: Verify wallet balance matches bank statement

## Common Workflows

### Monthly Statement Import

**Goal**: Import last month's credit card statement

1. Download CSV from bank (e.g., January 2026 statement)
2. Click **Import** on Transactions page
3. Upload CSV file
4. Select your bank template (e.g., Vietcombank)
5. Review and uncheck any duplicates
6. Import all valid transactions
7. Verify wallet balance updated correctly

### Catching Up After Vacation

**Goal**: Import 2-3 months of missed transactions

1. Download statements for each month separately
2. Import oldest month first (preserve chronological order)
3. Review and import each month one by one
4. Check for duplicates between months
5. Reconcile final balance with current wallet

### First-Time Setup

**Goal**: Import historical data to start tracking

1. Download last 6-12 months of statements
2. Start with oldest month first
3. Set correct wallet balance before first import
4. Import each month sequentially
5. Verify running balance stays accurate
6. Categorize transactions as needed

## Privacy & Security

**Your data is safe:**
- ✅ Files are parsed in memory and never permanently stored
- ✅ SSL/TLS encryption for all uploads
- ✅ Files automatically deleted after parsing
- ✅ No sharing of statement data with third parties
- ✅ You can delete imported transactions anytime

**What we don't store:**
- ❌ Original statement files
- ❌ Bank account numbers (unless in description text)
- ❌ Sensitive metadata from PDFs

## FAQ

**Q: Can I import from multiple banks?**
A: Yes! Import statements from different banks into different wallets or the same wallet.

**Q: Will this mess up my existing transactions?**
A: No. Duplicate detection prevents double-importing. You can also undo within 24 hours.

**Q: What if my bank isn't listed?**
A: Use "Custom Mapping" to manually configure column mapping. We add new bank templates based on user requests.

**Q: Can I edit transactions after import?**
A: Yes, but edited transactions cannot be undone as part of the batch. Edit before undo expires.

**Q: Does this work on mobile?**
A: Yes! The import feature is fully responsive and works on phones and tablets.

**Q: How long does import take?**
A: Typically 1-3 seconds for 100 transactions. Larger files (1,000+) may take 10-30 seconds.

**Q: Can I import investments or transfers?**
A: Currently only income/expense transactions. Transfers and investment imports coming soon.

**Q: What happens to categories?**
A: If your statement has category columns, they'll be mapped. Otherwise, transactions are uncategorized (you can bulk categorize later).

## Getting Help

**Need assistance?**
- Check this documentation first
- Review the [troubleshooting section](#troubleshooting)
- Contact support with your import error screenshot
- Join our community forum for tips from other users

**Reporting Issues:**
When reporting import problems, please include:
1. Bank name and statement format
2. Screenshot of error message
3. Sample row from your CSV (remove sensitive data)
4. Browser and device information

---

**Last Updated**: February 11, 2026
**Feature Version**: 1.0
**Supported Banks**: Vietcombank, Techcombank
