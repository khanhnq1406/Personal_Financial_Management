# Bank Statement Import User Guide

## Overview

The bank statement import feature allows you to quickly import your transaction history from your bank into WealthJourney. This guide will walk you through the process step-by-step.

---

## Supported File Formats

WealthJourney supports the following file formats:

- **CSV (.csv)** - Recommended for best performance
- **Excel (.xlsx, .xls)** - Supports multiple sheets
- **PDF (.pdf)** - Uses OCR for table extraction

### File Size Limits

- CSV & Excel: Maximum 10 MB
- PDF: Maximum 20 MB

---

## Step-by-Step Import Process

### Step 1: Export Your Bank Statement

1. Log in to your bank's online banking portal
2. Navigate to the account statement or transaction history section
3. Select the date range you want to export (e.g., last month)
4. Download the statement in one of the supported formats (CSV recommended)

**Tips:**
- Choose CSV format when available for faster processing
- Export smaller date ranges (1-3 months) for better performance
- Ensure the file is not password-protected

### Step 2: Upload Your File

1. In WealthJourney, navigate to the **Import** section
2. Click **Upload Bank Statement**
3. Select your downloaded file or drag and drop it
4. Wait for the upload to complete

**What happens:** The system validates your file type and size, then stores it temporarily for processing.

### Step 3: Select Bank Template or Custom Mapping

#### Option A: Use Bank Template (Recommended)

If your bank is supported, select it from the dropdown:

**Supported Banks:**
- Vietcombank (VCB) - CSV, Excel, PDF
- Techcombank (TCB) - CSV, Excel
- BIDV - CSV, Excel
- VietinBank (CTG) - CSV, Excel

The template automatically maps columns, so you can skip to Step 4.

#### Option B: Custom Column Mapping

If your bank isn't listed, you can manually map columns:

1. **Date Column:** Column containing transaction dates (e.g., "Transaction Date")
2. **Amount Column:** Column with transaction amounts (e.g., "Debit", "Credit", or "Amount")
3. **Description Column:** Column with transaction details (e.g., "Description", "Memo")
4. **Type Column (Optional):** If your statement has separate columns for income/expense
5. **Reference Column (Optional):** Transaction reference or ID number

**Date Format Examples:**
- `02/01/2006` → 02/01/2026
- `2006-01-02` → 2026-01-02
- `02-Jan-2006` → 02-Jan-2026

### Step 4: Review Parsed Transactions

After parsing, you'll see a preview of your transactions:

- **Total Rows:** Number of rows in your file
- **Valid Rows:** Transactions that passed validation
- **Error Rows:** Transactions with problems (highlighted in red)
- **Warning Rows:** Transactions with minor issues (highlighted in yellow)

**What to check:**
- Dates are correct
- Amounts match your statement
- Categories are suggested correctly
- No critical errors

**Common Errors:**
- Invalid date format
- Missing amount
- Duplicate reference numbers

**Fix errors by:**
- Excluding problem rows (checkbox on left)
- Editing your file and re-uploading
- Adjusting column mapping

### Step 5: Handle Currency Conversion (If Needed)

If your statement has transactions in multiple currencies:

1. The system will detect different currencies automatically
2. Choose automatic or manual exchange rates:
   - **Automatic:** Uses latest exchange rates from our provider
   - **Manual:** Enter your own rates (useful for historical transactions)

**Example:**
```
USD transaction: $100
Wallet currency: VND
Exchange rate: 24,500 (VND per USD)
Converted amount: 2,450,000 VND
```

### Step 6: Detect and Handle Duplicates

Before importing, check for duplicates:

1. Click **Detect Duplicates**
2. Review potential matches:
   - **High confidence (>90%):** Very likely duplicate
   - **Medium confidence (70-90%):** Possibly duplicate
   - **Low confidence (<70%):** Unlikely duplicate

**Duplicate Handling Options:**

- **Skip All Duplicates (Recommended):** Don't import detected duplicates
- **Merge Duplicates:** Update existing transactions with new data
- **Import All:** Import everything, including duplicates

**When to use each:**
- **Skip All:** Re-importing the same statement
- **Merge:** Updating incomplete transactions
- **Import All:** First-time import or missing transactions

### Step 7: Review and Import

Final review screen shows:

- Number of transactions to import
- Total income and expenses
- Net change to your wallet balance
- New wallet balance after import

Click **Import** to proceed.

### Step 8: Verify Import

After import completes:

1. Check the success message with import summary
2. Verify your wallet balance is correct
3. Review imported transactions in your transaction list
4. Check category assignments

**If something went wrong:**
- Use the **Undo Import** feature (available for 24 hours)
- Transactions will be deleted and balance restored
- You can then fix issues and re-import

---

## Tips for Best Results

### 1. File Preparation

- **Remove header rows:** If your CSV has multiple header rows, remove extras
- **Clean data:** Remove summary rows (totals, balances)
- **Single currency:** Keep transactions in one currency per file when possible
- **Date format:** Use consistent date format throughout the file

### 2. Performance

- **Batch size:** Import 500-1000 transactions at a time
- **File format:** CSV is fastest, PDF is slowest
- **Network:** Upload on stable internet connection

### 3. Duplicate Prevention

- **Track imports:** Keep notes on what periods you've imported
- **Use reference numbers:** Helps detect exact duplicates
- **Check dates:** Only import new transactions

### 4. Category Accuracy

- **Learn over time:** The system learns from your corrections
- **Consistent descriptions:** Banks with consistent naming improve accuracy
- **Manual review:** Check auto-assigned categories for first few imports

---

## Troubleshooting

### Problem: "File is too large"

**Solutions:**
- Split your statement into smaller date ranges
- Remove unnecessary columns
- Use CSV instead of Excel/PDF

### Problem: "Unable to read the uploaded file"

**Possible causes:**
- File is corrupted
- File is password-protected
- File format not actually CSV/Excel/PDF

**Solutions:**
- Re-download from bank
- Remove password protection
- Verify file extension matches content

### Problem: "No valid transactions found"

**Causes:**
- Wrong column mapping
- File only contains headers
- Date format not recognized

**Solutions:**
- Double-check column mapping
- Verify file has transaction data
- Try different date format

### Problem: "Rate limit exceeded"

**Explanation:** Maximum 10 imports per hour to prevent abuse

**Solution:** Wait for the cooldown period (shown in error message)

### Problem: "Currency conversion failed"

**Causes:**
- Exchange rate service unavailable
- Invalid currency code

**Solutions:**
- Try again later
- Use manual exchange rates
- Check currency codes are correct (e.g., USD, EUR, VND)

### Problem: "This operation would result in a negative balance"

**Cause:** Importing would make your wallet balance negative

**Solutions:**
- Verify transaction amounts are correct
- Check your current balance
- Add funds to wallet first
- Exclude problematic transactions

---

## Advanced Features

### Excel Multi-Sheet Support

1. Upload Excel file
2. System auto-detects sheets
3. Select the sheet with transaction data
4. Proceed with normal import flow

**Auto-detection logic:**
- Prioritizes sheets with "transaction" or "statement" in name
- Checks for sheets with most rows
- Validates sheet has numeric data

### Auto-Categorization

The system automatically suggests categories based on:

1. **Merchant rules:** Known merchants (e.g., "Starbucks" → Food & Dining)
2. **Keywords:** Description keywords (e.g., "gas" → Transportation)
3. **Your history:** Learns from your past categorizations
4. **Region-specific:** Optimized for Vietnamese merchants

**Confidence levels:**
- **90-100%:** Very confident, usually correct
- **70-89%:** Likely correct, review recommended
- **<70%:** Low confidence, manual review needed

### Import History

View your past imports:

- Date and time of import
- File name and type
- Number of transactions imported
- Income, expenses, and net change
- Undo availability (24 hours)

**Access:** Navigate to **Import → History**

---

## Frequently Asked Questions

### Q: How often can I import?

**A:** Maximum 10 imports per hour. For most users, importing once per month is sufficient.

### Q: Can I undo an import?

**A:** Yes, within 24 hours of import. After 24 hours, the undo option expires.

### Q: What happens to imported transactions?

**A:** They're added to your wallet with all details preserved, including original currency if converted.

### Q: Will importing affect my wallet balance?

**A:** Yes, your wallet balance updates to reflect all imported transactions.

### Q: Can I import from multiple banks?

**A:** Yes, you can import from any bank into any wallet. Just upload each statement separately.

### Q: What if my bank isn't supported?

**A:** Use custom column mapping to manually specify which columns contain date, amount, and description.

### Q: Are my files stored permanently?

**A:** No, uploaded files are automatically deleted after processing (typically within 1 hour).

### Q: Can I edit transactions after import?

**A:** Yes, you can edit any transaction details from the transactions page.

### Q: What if I accidentally import duplicates?

**A:** Use the undo feature within 24 hours, or manually delete duplicate transactions.

### Q: How accurate is duplicate detection?

**A:** The system uses multiple factors (date, amount, description, reference number) with 80-95% accuracy.

---

## Best Practices Summary

✅ **DO:**
- Export statements in CSV format when possible
- Check for duplicates before importing
- Review error rows and fix issues
- Verify balance after import
- Use undo if you make a mistake

❌ **DON'T:**
- Import the same period multiple times without checking duplicates
- Upload files larger than the size limit
- Ignore validation errors
- Import password-protected files
- Rush through the review steps

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the error message for specific suggestions
2. Review this troubleshooting section
3. Contact support with:
   - Screenshot of the error
   - Bank name and file format
   - Steps you took before the error

**Support channels:**
- Email: support@wealthjourney.com
- In-app chat support

---

## Changelog

- **2026-02-11:** Initial user guide with comprehensive import instructions
