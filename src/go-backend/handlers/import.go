package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"wealthjourney/domain/repository"
	"wealthjourney/domain/service"
	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/fileupload"
	"wealthjourney/pkg/handler"
	"wealthjourney/pkg/logger"
	"wealthjourney/pkg/metrics"
	"wealthjourney/pkg/parser"
	v1 "wealthjourney/protobuf/v1"
)

// ImportHandler handles import-related HTTP requests.
type ImportHandler struct {
	importRepo    repository.ImportRepository
	importService service.ImportService
}

// NewImportHandler creates a new ImportHandler instance.
func NewImportHandler(importRepo repository.ImportRepository, importService service.ImportService) *ImportHandler {
	return &ImportHandler{
		importRepo:    importRepo,
		importService: importService,
	}
}

// ListBankTemplates retrieves all available bank templates.
// @Summary List bank templates
// @Tags import
// @Produce json
// @Success 200 {object} v1.ListBankTemplatesResponse
// @Failure 401 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/import/templates [get]
func (h *ImportHandler) ListBankTemplates(c *gin.Context) {
	response, err := h.importService.ListBankTemplates(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch bank templates",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// UploadFile handles bank statement file upload.
// @Summary Upload bank statement file
// @Tags import
// @Accept json
// @Produce json
// @Param request body v1.UploadStatementFileRequest true "Upload file request"
// @Success 200 {object} v1.UploadStatementFileResponse
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/import/upload [post]
func (h *ImportHandler) UploadFile(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}
	_ = userID // Will be used for user-specific upload directory in future

	// Bind and validate request
	var req v1.UploadStatementFileRequest
	if err := handler.BindAndValidate(c, &req); err != nil {
		handler.BadRequest(c, err)
		return
	}


	// Validate required fields
	if len(req.FileData) == 0 {
		handler.BadRequest(c, apperrors.NewValidationError("file is required"))
		return
	}

	if req.FileName == "" {
		handler.BadRequest(c, apperrors.NewValidationError("fileName is required"))
		return
	}

	// Sanitize filename
	sanitizedName, err := fileupload.SanitizeFileName(req.FileName)
	if err != nil {
		logger.LogImportError(c.Request.Context(), userID, "upload:sanitize_filename", err, map[string]interface{}{
			"original_filename": req.FileName,
			"file_size":         req.FileSize,
		})
		handler.BadRequest(c, apperrors.WrapWithUserMessage(err))
		return
	}

	// Validate file content (MIME type and security)
	if err := fileupload.ValidateFileContent(req.FileData, sanitizedName); err != nil {
		logger.LogImportError(c.Request.Context(), userID, "upload:validate_content", err, map[string]interface{}{
			"filename":  sanitizedName,
			"file_size": req.FileSize,
		})
		handler.BadRequest(c, apperrors.WrapWithUserMessage(err))
		return
	}

	// Determine file type for metrics
	fileType, _ := fileupload.ValidateFileType(sanitizedName)

	// Record file upload size metric
	metrics.FileUploadSize.WithLabelValues(string(fileType)).Observe(float64(req.FileSize))

	// Upload file from bytes
	result, err := fileupload.UploadFileFromBytes(req.FileData, sanitizedName, req.FileSize)
	if err != nil {
		logger.LogImportError(c.Request.Context(), userID, "upload:save_file", err, map[string]interface{}{
			"filename":  sanitizedName,
			"file_size": req.FileSize,
			"file_type": string(fileType),
		})
		// Wrap error with user-friendly message
		handler.BadRequest(c, apperrors.WrapWithUserMessage(err))
		return
	}

	// Log success
	logger.LogImportSuccess(c.Request.Context(), userID, "upload", map[string]interface{}{
		"file_id":   result.FileID,
		"file_type": string(fileType),
		"file_size": req.FileSize,
	})

	// Build response
	response := &v1.UploadStatementFileResponse{
		Success:   true,
		Message:   "File uploaded successfully",
		FileId:    result.FileID,
		Timestamp: time.Now().Format(time.RFC3339),
	}

	handler.Success(c, response)
}

// ParseFile parses an uploaded bank statement file.
// @Summary Parse bank statement file
// @Tags import
// @Accept json
// @Produce json
// @Param request body v1.ParseStatementRequest true "Parse request"
// @Success 200 {object} v1.ParseStatementResponse
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/import/parse [post]
func (h *ImportHandler) ParseFile(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}
	_ = userID // Will be used for permission checks in future

	// Bind and validate request
	var req v1.ParseStatementRequest
	if err := handler.BindAndValidate(c, &req); err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Validate required fields
	if req.FileId == "" {
		handler.BadRequest(c, apperrors.NewValidationError("fileId is required"))
		return
	}

	// Get file path from upload directory
	// First, find the actual file with any extension
	matches, err := filepath.Glob(filepath.Join(fileupload.UploadDir, req.FileId+".*"))
	if err != nil || len(matches) == 0 {
		handler.BadRequest(c, apperrors.NewValidationError("uploaded file not found"))
		return
	}
	filePath := matches[0]
	fileExt := filepath.Ext(filePath)

	// Get bank template or custom mapping
	var columnMapping *parser.ColumnMapping

	if req.BankTemplateId != "" {
		// Load bank template from repository
		template, err := h.importRepo.GetBankTemplateByID(c.Request.Context(), req.BankTemplateId)
		if err != nil {
			handler.BadRequest(c, apperrors.NewValidationError(fmt.Sprintf("invalid bank template: %s", req.BankTemplateId)))
			return
		}

		// Parse column mapping from JSON
		var mapping struct {
			DateColumn        int `json:"dateColumn"`
			AmountColumn      int `json:"amountColumn"`
			DescriptionColumn int `json:"descriptionColumn"`
			TypeColumn        int `json:"typeColumn"`
			CategoryColumn    int `json:"categoryColumn"`
			ReferenceColumn   int `json:"referenceColumn"`
		}

		if err := json.Unmarshal(template.ColumnMapping, &mapping); err != nil {
			handler.BadRequest(c, apperrors.NewValidationError(fmt.Sprintf("invalid column mapping in template: %v", err)))
			return
		}

		// Convert template to column mapping
		columnMapping = &parser.ColumnMapping{
			DateColumn:        mapping.DateColumn,
			AmountColumn:      mapping.AmountColumn,
			DescriptionColumn: mapping.DescriptionColumn,
			TypeColumn:        mapping.TypeColumn - 1,    // -1 if not present (0 index becomes -1)
			CategoryColumn:    mapping.CategoryColumn - 1,
			ReferenceColumn:   mapping.ReferenceColumn - 1,
			DateFormat:        template.DateFormat,
			Currency:          template.Currency,
		}
	} else if req.CustomMapping != nil {
		// Use custom mapping (convert string column names to indices if needed)
		// For now, assume custom mapping provides numeric indices as strings
		dateCol, _ := strconv.Atoi(req.CustomMapping.DateColumn)
		amountCol, _ := strconv.Atoi(req.CustomMapping.AmountColumn)
		descCol, _ := strconv.Atoi(req.CustomMapping.DescriptionColumn)
		typeCol, _ := strconv.Atoi(req.CustomMapping.TypeColumn)
		catCol, _ := strconv.Atoi(req.CustomMapping.CategoryColumn)
		refCol, _ := strconv.Atoi(req.CustomMapping.ReferenceColumn)

		columnMapping = &parser.ColumnMapping{
			DateColumn:        dateCol,
			AmountColumn:      amountCol,
			DescriptionColumn: descCol,
			TypeColumn:        typeCol - 1,    // -1 if not present
			CategoryColumn:    catCol - 1,
			ReferenceColumn:   refCol - 1,
			DateFormat:        req.CustomMapping.DateFormat,
			Currency:          req.CustomMapping.Currency,
		}
	} else {
		handler.BadRequest(c, apperrors.NewValidationError("either bankTemplateId or customMapping is required"))
		return
	}

	// Parse file based on extension
	var parsedRows []*parser.ParsedRow

	// Track parsing duration
	parseStart := time.Now()
	fileTypeStr := "csv"

	switch fileExt {
	case ".pdf":
		fileTypeStr = "pdf"
		// Use PDF parser
		pdfParser := parser.NewPDFParser(filePath, columnMapping)
		parsedRows, err = pdfParser.Parse()
		if err != nil {
			metrics.ImportAttempts.WithLabelValues("error", fileTypeStr).Inc()
			logger.LogImportError(c.Request.Context(), userID, "parse:pdf", err, logger.ImportErrorMetadata(
				req.FileId, fileTypeStr, 0, 0,
			))
			handler.BadRequest(c, apperrors.WrapWithUserMessage(err))
			return
		}
	case ".xlsx", ".xls":
		fileTypeStr = "excel"
		// Use Excel parser
		excelParser := parser.NewExcelParser(filePath, columnMapping)
		defer excelParser.Close() // Clean up: close the Excel file

		// Set specific sheet if provided
		if req.SheetName != "" {
			excelParser.SetSheet(req.SheetName)
		}

		parsedRows, err = excelParser.Parse()
		if err != nil {
			metrics.ImportAttempts.WithLabelValues("error", fileTypeStr).Inc()
			logger.LogImportError(c.Request.Context(), userID, "parse:excel", err, logger.ImportErrorMetadata(
				req.FileId, fileTypeStr, 0, 0,
			))
			handler.BadRequest(c, apperrors.WrapWithUserMessage(err))
			return
		}
	default:
		// Use CSV parser (default for .csv and any other text format)
		csvParser := parser.NewCSVParser(filePath, columnMapping)
		parsedRows, err = csvParser.Parse()
		if err != nil {
			metrics.ImportAttempts.WithLabelValues("error", fileTypeStr).Inc()
			logger.LogImportError(c.Request.Context(), userID, "parse:csv", err, logger.ImportErrorMetadata(
				req.FileId, fileTypeStr, 0, 0,
			))
			handler.BadRequest(c, apperrors.WrapWithUserMessage(err))
			return
		}
	}

	// Record parsing duration
	parseDuration := time.Since(parseStart).Seconds()
	metrics.ImportDuration.WithLabelValues("parse").Observe(parseDuration)

	// Convert parsed rows to protobuf format
	var transactions []*v1.ParsedTransaction
	var totalRows, validRows, errorRows, warningRows int32

	for _, row := range parsedRows {
		totalRows++

		// Convert validation errors
		var validationErrors []*v1.ValidationError
		for _, ve := range row.ValidationErrors {
			validationErrors = append(validationErrors, &v1.ValidationError{
				Field:    ve.Field,
				Message:  ve.Message,
				Severity: ve.Severity,
			})

			if ve.Severity == "error" {
				errorRows++
			} else if ve.Severity == "warning" {
				warningRows++
			}
		}

		if row.IsValid {
			validRows++
		} else {
			errorRows++
		}

		// Determine transaction type
		txType := v1.TransactionType_TRANSACTION_TYPE_EXPENSE
		if row.Amount > 0 {
			txType = v1.TransactionType_TRANSACTION_TYPE_INCOME
		}

		// Suggest category based on description
		categorySuggestion := parser.SuggestCategory(row.Description, int32(txType))

		transactions = append(transactions, &v1.ParsedTransaction{
			RowNumber:   int32(row.RowNumber),
			Date:        row.Date.Unix(),
			Amount: &v1.Money{
				Amount:   row.Amount,
				Currency: columnMapping.Currency,
			},
			Description:        row.Description,
			Type:               txType,
			SuggestedCategoryId: categorySuggestion.CategoryID,
			CategoryConfidence:  categorySuggestion.Confidence,
			ReferenceNumber:     row.ReferenceNum,
			ValidationErrors:    validationErrors,
			IsValid:             row.IsValid,
		})
	}

	// Detect currencies used in transactions
	currenciesUsed := make(map[string]int)
	for _, tx := range transactions {
		if tx.Amount != nil && tx.Amount.Currency != "" {
			currenciesUsed[tx.Amount.Currency]++
		}
	}

	// Get wallet to determine wallet currency
	walletCurrency := columnMapping.Currency
	if walletCurrency == "" {
		walletCurrency = "VND" // Default
	}

	// Determine if conversion needed
	needsConversion := false
	for currency := range currenciesUsed {
		if currency != walletCurrency {
			needsConversion = true
			break
		}
	}

	// Build currency list
	currencyList := make([]string, 0, len(currenciesUsed))
	for currency := range currenciesUsed {
		currencyList = append(currencyList, currency)
	}

	// Build response
	response := &v1.ParseStatementResponse{
		Success:      true,
		Message:      fmt.Sprintf("Parsed %d transactions", totalRows),
		Transactions: transactions,
		Statistics: &v1.ParseStatistics{
			TotalRows:   totalRows,
			ValidRows:   validRows,
			ErrorRows:   errorRows,
			WarningRows: warningRows,
		},
		CurrencyInfo: &v1.CurrencyInfo{
			WalletCurrency:  walletCurrency,
			CurrenciesFound: currencyList,
			NeedsConversion: needsConversion,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}

	handler.Success(c, response)
}

// DetectDuplicates detects potential duplicates for imported transactions.
// @Summary Detect duplicate transactions
// @Tags import
// @Accept json
// @Produce json
// @Param request body v1.DetectDuplicatesRequest true "Detect duplicates request"
// @Success 200 {object} v1.DetectDuplicatesResponse
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/import/detect-duplicates [post]
func (h *ImportHandler) DetectDuplicates(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Bind and validate request
	var req v1.DetectDuplicatesRequest
	if err := handler.BindAndValidate(c, &req); err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Validate required fields
	if req.WalletId == 0 {
		handler.BadRequest(c, apperrors.NewValidationError("walletId is required"))
		return
	}

	if len(req.Transactions) == 0 {
		handler.BadRequest(c, apperrors.NewValidationError("transactions list cannot be empty"))
		return
	}

	// Detect duplicates via service
	result, err := h.importService.DetectDuplicates(c.Request.Context(), userID, &req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// ConvertCurrency converts imported transactions to wallet currency using exchange rates.
// @Summary Convert transaction currencies
// @Tags import
// @Accept json
// @Produce json
// @Param request body v1.ConvertCurrencyRequest true "Convert currency request"
// @Success 200 {object} v1.ConvertCurrencyResponse
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/import/convert-currency [post]
func (h *ImportHandler) ConvertCurrency(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Bind and validate request
	var req v1.ConvertCurrencyRequest
	if err := handler.BindAndValidate(c, &req); err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Validate required fields
	if req.WalletId == 0 {
		handler.BadRequest(c, apperrors.NewValidationError("walletId is required"))
		return
	}

	if len(req.Transactions) == 0 {
		handler.BadRequest(c, apperrors.NewValidationError("transactions list cannot be empty"))
		return
	}

	// Convert currencies via service
	result, err := h.importService.ConvertCurrency(c.Request.Context(), userID, &req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// ConfirmImport confirms and imports parsed transactions.
// @Summary Confirm and import transactions
// @Tags import
// @Accept json
// @Produce json
// @Param request body v1.ExecuteImportRequest true "Execute import request"
// @Success 200 {object} v1.ExecuteImportResponse
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/import/confirm [post]
func (h *ImportHandler) ConfirmImport(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Bind and validate request
	var req v1.ExecuteImportRequest
	if err := handler.BindAndValidate(c, &req); err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Validate required fields
	if req.WalletId == 0 {
		handler.BadRequest(c, apperrors.NewValidationError("walletId is required"))
		return
	}

	if len(req.Transactions) == 0 {
		handler.BadRequest(c, apperrors.NewValidationError("transactions list cannot be empty"))
		return
	}

	// Execute import via service
	result, err := h.importService.ExecuteImport(c.Request.Context(), userID, &req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	// Cleanup uploaded file after successful import
	if req.FileId != "" {
		_ = fileupload.CleanupFile(req.FileId) // Best effort cleanup
	}

	handler.Success(c, result)
}

// ListImportBatches retrieves import history for the authenticated user.
// @Summary List import batches
// @Tags import
// @Produce json
// @Param page query int false "Page number (default: 1)"
// @Param page_size query int false "Page size (default: 20, max: 100)"
// @Success 200 {object} v1.GetImportHistoryResponse
// @Failure 401 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/import/history [get]
func (h *ImportHandler) ListImportBatches(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Parse pagination parameters
	paginationParams := parsePaginationParamsProto(c)

	// Build request
	req := &v1.GetImportHistoryRequest{
		Pagination: paginationParams,
	}

	// Call service
	result, err := h.importService.GetImportHistory(c.Request.Context(), userID, req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// GetImportBatch retrieves details of a specific import batch.
// @Summary Get import batch details
// @Tags import
// @Produce json
// @Param id path string true "Import batch ID"
// @Success 200 {object} v1.ImportBatch
// @Failure 401 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/import/{id} [get]
func (h *ImportHandler) GetImportBatch(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Get import ID from path parameter
	importID := c.Param("id")
	if importID == "" {
		handler.BadRequest(c, apperrors.NewValidationError("import batch ID is required"))
		return
	}

	// Get import batch
	batch, err := h.importRepo.GetImportBatchByID(c.Request.Context(), importID)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	// Verify ownership
	if batch.UserID != userID {
		handler.NotFound(c, "Import batch not found")
		return
	}

	// Convert to protobuf format
	pbBatch := &v1.ImportBatch{
		Id:           batch.ID,
		UserId:       batch.UserID,
		WalletId:     batch.WalletID,
		FileName:     batch.FileName,
		FileType:     batch.FileType,
		BankTemplate: batch.BankTemplate,
		ImportedAt:   batch.ImportedAt.Unix(),
		Summary: &v1.ImportSummary{
			TotalImported:     batch.ValidRows,
			TotalSkipped:      batch.SkippedRows,
			DuplicatesMerged:  batch.DuplicatesMerged,
			DuplicatesSkipped: batch.DuplicatesSkipped,
			TotalIncome: &v1.Money{
				Amount:   batch.TotalIncome,
				Currency: "VND",
			},
			TotalExpenses: &v1.Money{
				Amount:   batch.TotalExpenses,
				Currency: "VND",
			},
			NetChange: &v1.Money{
				Amount:   batch.NetChange,
				Currency: "VND",
			},
		},
		CanUndo:       batch.CanUndo && batch.UndoneAt == nil && time.Now().Before(batch.UndoExpiresAt),
		UndoExpiresAt: batch.UndoExpiresAt.Unix(),
	}

	handler.Success(c, pbBatch)
}

// UndoImport undoes an import batch within 24 hours.
// @Summary Undo import batch
// @Tags import
// @Accept json
// @Produce json
// @Param id path string true "Import batch ID"
// @Success 200 {object} v1.UndoImportResponse
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/import/{id}/undo [post]
func (h *ImportHandler) UndoImport(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Get import ID from path parameter
	importID := c.Param("id")
	if importID == "" {
		handler.BadRequest(c, apperrors.NewValidationError("import batch ID is required"))
		return
	}

	// Call service to undo import
	result, err := h.importService.UndoImport(c.Request.Context(), userID, importID)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// ListExcelSheets lists all available sheets in an Excel file.
// @Summary List Excel sheets
// @Tags import
// @Produce json
// @Param file_id path string true "File ID from upload"
// @Success 200 {object} v1.ListExcelSheetsResponse
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/import/excel-sheets/{file_id} [get]
func (h *ImportHandler) ListExcelSheets(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Get file ID from path parameter
	fileID := c.Param("file_id")
	if fileID == "" {
		handler.BadRequest(c, apperrors.NewValidationError("file ID is required"))
		return
	}

	// Call service to list sheets
	response, err := h.importService.ListExcelSheets(c.Request.Context(), userID, fileID)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, response)
}
