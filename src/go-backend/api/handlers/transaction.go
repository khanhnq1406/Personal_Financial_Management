package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"wealthjourney/domain/service"
	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/handler"
	transactionv1 "wealthjourney/protobuf/v1"
)

// TransactionHandlers handles transaction-related HTTP requests.
type TransactionHandlers struct {
	transactionService service.TransactionService
}

// NewTransactionHandlers creates a new TransactionHandlers instance.
func NewTransactionHandlers(transactionService service.TransactionService) *TransactionHandlers {
	return &TransactionHandlers{
		transactionService: transactionService,
	}
}

// CreateTransaction creates a new transaction.
// @Summary Create a new transaction
// @Tags transactions
// @Accept json
// @Produce json
// @Param request body transactionv1.CreateTransactionRequest true "Transaction creation request"
// @Success 201 {object} types.APIResponse{data=transactionv1.Transaction}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/transactions [post]
func (h *TransactionHandlers) CreateTransaction(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Bind and validate request
	var req transactionv1.CreateTransactionRequest
	if err := handler.BindAndValidate(c, &req); err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Validate required fields
	if req.WalletId == 0 {
		handler.BadRequest(c, apperrors.NewValidationError("wallet_id is required"))
		return
	}

	if req.Amount == nil || req.Amount.Amount == 0 {
		handler.BadRequest(c, apperrors.NewValidationError("amount is required"))
		return
	}

	// Call service
	result, err := h.transactionService.CreateTransaction(c.Request.Context(), userID, &req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Created(c, result)
}

// GetTransaction retrieves a transaction by ID.
// @Summary Get a transaction
// @Tags transactions
// @Produce json
// @Param id path int true "Transaction ID"
// @Success 200 {object} types.APIResponse{data=transactionv1.Transaction}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 403 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/transactions/{id} [get]
func (h *TransactionHandlers) GetTransaction(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Parse transaction ID
	transactionID, err := parseIDParam(c, "id")
	if err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Call service
	result, err := h.transactionService.GetTransaction(c.Request.Context(), transactionID, userID)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// ListTransactions lists transactions with filtering and pagination.
// @Summary List transactions
// @Tags transactions
// @Produce json
// @Param page query int false "Page number (default: 1)"
// @Param page_size query int false "Page size (default: 20, max: 100)"
// @Param wallet_id query int false "Filter by wallet ID"
// @Param category_id query int false "Filter by category ID"
// @Param type query string false "Filter by type (Income, Expense)"
// @Param start_date query int false "Filter by start date (Unix timestamp)"
// @Param end_date query int false "Filter by end date (Unix timestamp)"
// @Param min_amount query int false "Filter by minimum amount (in cents)"
// @Param max_amount query int false "Filter by maximum amount (in cents)"
// @Param search_note query string false "Search in note field"
// @Param sort_field query string false "Sort field (date, amount, created_at)"
// @Param sort_order query string false "Sort order (asc, desc)"
// @Success 200 {object} types.APIResponse{data=transactionv1.ListTransactionsResponse}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/transactions [get]
func (h *TransactionHandlers) ListTransactions(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Build request from query parameters
	req := &transactionv1.ListTransactionsRequest{
		Pagination: parsePaginationParamsProto(c),
		Filter:     parseTransactionFilter(c),
		SortField:  parseSortField(c),
		SortOrder:  parseSortOrder(c),
	}

	// Call service
	result, err := h.transactionService.ListTransactions(c.Request.Context(), userID, req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// UpdateTransaction updates a transaction.
// @Summary Update a transaction
// @Tags transactions
// @Accept json
// @Produce json
// @Param id path int true "Transaction ID"
// @Param request body transactionv1.UpdateTransactionRequest true "Transaction update request"
// @Success 200 {object} types.APIResponse{data=transactionv1.Transaction}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 403 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/transactions/{id} [put]
func (h *TransactionHandlers) UpdateTransaction(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Parse transaction ID
	transactionID, err := parseIDParam(c, "id")
	if err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Bind and validate request
	var req transactionv1.UpdateTransactionRequest
	if err := handler.BindAndValidate(c, &req); err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Validate amount is provided
	if req.Amount == nil || req.Amount.Amount == 0 {
		handler.BadRequest(c, apperrors.NewValidationError("amount is required"))
		return
	}

	// Call service
	result, err := h.transactionService.UpdateTransaction(c.Request.Context(), transactionID, userID, &req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// DeleteTransaction deletes a transaction.
// @Summary Delete a transaction
// @Tags transactions
// @Produce json
// @Param id path int true "Transaction ID"
// @Success 200 {object} types.APIResponse
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 403 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/transactions/{id} [delete]
func (h *TransactionHandlers) DeleteTransaction(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Parse transaction ID
	transactionID, err := parseIDParam(c, "id")
	if err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Call service
	result, err := h.transactionService.DeleteTransaction(c.Request.Context(), transactionID, userID)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// Helper functions for parsing query parameters

// parseTransactionFilter parses filter parameters from query string.
func parseTransactionFilter(c *gin.Context) *transactionv1.TransactionFilter {
	filter := &transactionv1.TransactionFilter{}

	// Parse wallet_id
	if walletIDStr := c.Query("wallet_id"); walletIDStr != "" {
		if walletID, err := strconv.ParseInt(walletIDStr, 10, 32); err == nil {
			walletID32 := int32(walletID)
			filter.WalletId = &walletID32
		}
	}

	// Parse category_id
	if categoryIDStr := c.Query("category_id"); categoryIDStr != "" {
		if categoryID, err := strconv.ParseInt(categoryIDStr, 10, 32); err == nil {
			categoryID32 := int32(categoryID)
			filter.CategoryId = &categoryID32
		}
	}

	// Parse type
	if typeStr := c.Query("type"); typeStr != "" {
		var txType transactionv1.TransactionType
		switch typeStr {
		case "Income":
			txType = transactionv1.TransactionType_TRANSACTION_TYPE_INCOME
		case "Expense":
			txType = transactionv1.TransactionType_TRANSACTION_TYPE_EXPENSE
		default:
			txType = transactionv1.TransactionType_TRANSACTION_TYPE_UNSPECIFIED
		}
		filter.Type = &txType
	}

	// Parse start_date
	if startDateStr := c.Query("start_date"); startDateStr != "" {
		if startDate, err := strconv.ParseInt(startDateStr, 10, 64); err == nil {
			filter.StartDate = &startDate
		}
	}

	// Parse end_date
	if endDateStr := c.Query("end_date"); endDateStr != "" {
		if endDate, err := strconv.ParseInt(endDateStr, 10, 64); err == nil {
			filter.EndDate = &endDate
		}
	}

	// Parse min_amount
	if minAmountStr := c.Query("min_amount"); minAmountStr != "" {
		if minAmount, err := strconv.ParseInt(minAmountStr, 10, 64); err == nil {
			filter.MinAmount = &minAmount
		}
	}

	// Parse max_amount
	if maxAmountStr := c.Query("max_amount"); maxAmountStr != "" {
		if maxAmount, err := strconv.ParseInt(maxAmountStr, 10, 64); err == nil {
			filter.MaxAmount = &maxAmount
		}
	}

	// Parse search_note
	if searchNote := c.Query("search_note"); searchNote != "" {
		filter.SearchNote = &searchNote
	}

	return filter
}

// parseSortField parses the sort field from query string.
func parseSortField(c *gin.Context) transactionv1.SortField {
	sortFieldStr := c.DefaultQuery("sort_field", "date")
	switch sortFieldStr {
	case "date":
		return transactionv1.SortField_DATE
	case "amount":
		return transactionv1.SortField_AMOUNT
	case "created_at":
		return transactionv1.SortField_CREATED_AT
	case "updated_at":
		return transactionv1.SortField_UPDATED_AT
	default:
		return transactionv1.SortField_DATE
	}
}

// parseSortOrder parses the sort order from query string.
func parseSortOrder(c *gin.Context) string {
	sortOrder := c.DefaultQuery("sort_order", "desc")
	if sortOrder != "asc" && sortOrder != "desc" {
		return "desc"
	}
	return sortOrder
}

// parsePaginationParamsProto parses pagination parameters from query string into protobuf format.
// Supports both flat format (page, page_size) and nested format (pagination.page, pagination.pageSize)
func parsePaginationParamsProto(c *gin.Context) *transactionv1.PaginationParams {
	page := int32(1)      // Default page
	pageSize := int32(20) // Default page size
	orderBy := "date"     // Default order by
	order := "desc"       // Default order

	// Try flat format first (for backward compatibility)
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.ParseInt(pageStr, 10, 32); err == nil {
			page = int32(p)
		}
	} else if pageStr := c.Query("pagination.page"); pageStr != "" {
		// Try nested format (gRPC-Gateway style)
		if p, err := strconv.ParseInt(pageStr, 10, 32); err == nil {
			page = int32(p)
		}
	}

	if pageSizeStr := c.Query("page_size"); pageSizeStr != "" {
		if ps, err := strconv.ParseInt(pageSizeStr, 10, 32); err == nil {
			pageSize = int32(ps)
		}
	} else if pageSizeStr := c.Query("pagination.pageSize"); pageSizeStr != "" {
		if ps, err := strconv.ParseInt(pageSizeStr, 10, 32); err == nil {
			pageSize = int32(ps)
		}
	}

	if ob := c.Query("order_by"); ob != "" {
		orderBy = ob
	} else if ob := c.Query("pagination.orderBy"); ob != "" {
		orderBy = ob
	}

	if o := c.Query("order"); o != "" {
		order = o
	} else if o := c.Query("pagination.order"); o != "" {
		order = o
	}

	return &transactionv1.PaginationParams{
		Page:     page,
		PageSize: pageSize,
		OrderBy:  orderBy,
		Order:    order,
	}
}
