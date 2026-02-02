package handlers

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"wealthjourney/domain/service"
	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/handler"
	"wealthjourney/pkg/types"
	"wealthjourney/pkg/validator"
	investmentv1 "wealthjourney/protobuf/v1"
)

// InvestmentHandlers handles investment-related HTTP requests.
type InvestmentHandlers struct {
	investmentService service.InvestmentService
}

// NewInvestmentHandlers creates a new InvestmentHandlers instance.
func NewInvestmentHandlers(investmentService service.InvestmentService) *InvestmentHandlers {
	return &InvestmentHandlers{
		investmentService: investmentService,
	}
}

// CreateInvestment creates a new investment holding.
// @Summary Create a new investment
// @Tags investments
// @Accept json
// @Produce json
// @Param request body investmentv1.CreateInvestmentRequest true "Investment creation request"
// @Success 201 {object} types.APIResponse{data=investmentv1.Investment}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/investments [post]
func (h *InvestmentHandlers) CreateInvestment(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Bind and validate request
	var req investmentv1.CreateInvestmentRequest
	if err := handler.BindAndValidate(c, &req); err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Validate wallet ID
	if err := validator.ID(req.WalletId); err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Validate symbol
	if req.Symbol == "" {
		handler.BadRequest(c, apperrors.NewValidationError("symbol is required"))
		return
	}

	// Validate investment type
	if req.Type == investmentv1.InvestmentType_INVESTMENT_TYPE_UNSPECIFIED {
		handler.BadRequest(c, apperrors.NewValidationError("investment type is required"))
		return
	}

	// Set default currency if not provided
	if req.Currency == "" {
		req.Currency = types.USD
	}

	// Convert decimal fields to int64 if provided
	if req.InitialCostDecimal > 0 {
		// Convert decimal to smallest currency unit
		// USD: multiply by 100 (cents), VND: multiply by 1 (dong)
		multiplier := int64(1)
		if req.Currency == "USD" || req.Currency == "EUR" || req.Currency == "GBP" {
			multiplier = 100 // 2 decimal places
		}
		// For zero-decimal currencies like VND, JPY, keep as is
		req.InitialCost = int64(req.InitialCostDecimal * float64(multiplier))
	}
	if req.InitialQuantityDecimal > 0 {
		req.InitialQuantity = int64(req.InitialQuantityDecimal * 10000) // Standard storage multiplier
	}

	// Call service
	result, err := h.investmentService.CreateInvestment(c.Request.Context(), userID, &req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Created(c, result)
}

// GetInvestment retrieves an investment by ID.
// @Summary Get an investment
// @Tags investments
// @Produce json
// @Param id path int true "Investment ID"
// @Success 200 {object} types.APIResponse{data=investmentv1.Investment}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 403 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/investments/{id} [get]
func (h *InvestmentHandlers) GetInvestment(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Parse investment ID
	investmentID, err := parseIDParam(c, "id")
	if err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Call service
	result, err := h.investmentService.GetInvestment(c.Request.Context(), investmentID, userID)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// ListInvestments lists all investments for a wallet.
// @Summary List investments for a wallet
// @Tags investments
// @Produce json
// @Param id path int true "Wallet ID"
// @Param page query int false "Page number (default: 1)"
// @Param page_size query int false "Page size (default: 20, max: 100)"
// @Param order_by query string false "Order by field (default: created_at)"
// @Param order query string false "Order direction (asc or desc, default: desc)"
// @Param typeFilter query int false "Filter by investment type"
// @Success 200 {object} types.APIResponse{data=[]investmentv1.Investment}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/wallets/{id}/investments [get]
func (h *InvestmentHandlers) ListInvestments(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Parse wallet ID
	walletID, err := parseIDParam(c, "id")
	if err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Build request
	var req investmentv1.ListInvestmentsRequest
	req.WalletId = walletID

	// Parse pagination parameters
	pagination := parsePaginationParams(c)
	req.Pagination = &investmentv1.PaginationParams{
		Page:     int32(pagination.Page),
		PageSize: int32(pagination.PageSize),
		OrderBy:  pagination.OrderBy,
		Order:    pagination.Order,
	}

	// Parse type filter if provided
	if typeFilterStr := c.Query("typeFilter"); typeFilterStr != "" {
		typeFilter, err := strconv.ParseInt(typeFilterStr, 10, 32)
		if err != nil {
			handler.BadRequest(c, apperrors.NewValidationError("invalid typeFilter parameter"))
			return
		}
		req.TypeFilter = investmentv1.InvestmentType(typeFilter)
	}

	// Call service
	result, err := h.investmentService.ListInvestments(c.Request.Context(), userID, &req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// UpdateInvestment updates an investment's details.
// @Summary Update an investment
// @Tags investments
// @Accept json
// @Produce json
// @Param id path int true "Investment ID"
// @Param request body investmentv1.UpdateInvestmentRequest true "Investment update request"
// @Success 200 {object} types.APIResponse{data=investmentv1.Investment}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 403 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/investments/{id} [put]
func (h *InvestmentHandlers) UpdateInvestment(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Parse investment ID
	investmentID, err := parseIDParam(c, "id")
	if err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Bind and validate request
	var req investmentv1.UpdateInvestmentRequest
	if err := handler.BindAndValidate(c, &req); err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Set ID from path parameter
	req.Id = investmentID

	// Validate name if provided
	if req.Name == "" {
		handler.BadRequest(c, apperrors.NewValidationError("name is required"))
		return
	}

	// Call service
	result, err := h.investmentService.UpdateInvestment(c.Request.Context(), investmentID, userID, &req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// DeleteInvestment deletes an investment.
// @Summary Delete an investment
// @Tags investments
// @Produce json
// @Param id path int true "Investment ID"
// @Success 200 {object} types.APIResponse{data=investmentv1.DeleteInvestmentResponse}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 403 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/investments/{id} [delete]
func (h *InvestmentHandlers) DeleteInvestment(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Parse investment ID
	investmentID, err := parseIDParam(c, "id")
	if err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Call service
	result, err := h.investmentService.DeleteInvestment(c.Request.Context(), investmentID, userID)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// AddTransaction adds a buy/sell transaction to an investment.
// @Summary Add a transaction to an investment
// @Tags investments
// @Accept json
// @Produce json
// @Param id path int true "Investment ID"
// @Param request body investmentv1.AddTransactionRequest true "Transaction request"
// @Success 201 {object} types.APIResponse{data=investmentv1.AddTransactionResponse}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/investments/{id}/transactions [post]
func (h *InvestmentHandlers) AddTransaction(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Parse investment ID
	investmentID, err := parseIDParam(c, "id")
	if err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Bind and validate request
	var req investmentv1.AddTransactionRequest
	if err := handler.BindAndValidate(c, &req); err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Set investment ID from path parameter
	req.InvestmentId = investmentID

	// Validate transaction type
	if req.Type == investmentv1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_UNSPECIFIED {
		handler.BadRequest(c, apperrors.NewValidationError("transaction type is required"))
		return
	}

	// Validate quantity
	if req.Quantity <= 0 {
		handler.BadRequest(c, apperrors.NewValidationError("quantity must be positive"))
		return
	}

	// Validate price
	if req.Price <= 0 {
		handler.BadRequest(c, apperrors.NewValidationError("price must be positive"))
		return
	}

	// Validate fees
	if req.Fees < 0 {
		handler.BadRequest(c, apperrors.NewValidationError("fees cannot be negative"))
		return
	}

	// Set default transaction date if not provided
	if req.TransactionDate == 0 {
		req.TransactionDate = time.Now().Unix()
	}

	// Call service
	result, err := h.investmentService.AddTransaction(c.Request.Context(), userID, &req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Created(c, result)
}

// ListTransactions retrieves transactions for an investment.
// @Summary List transactions for an investment
// @Tags investments
// @Produce json
// @Param id path int true "Investment ID"
// @Param page query int false "Page number (default: 1)"
// @Param page_size query int false "Page size (default: 20, max: 100)"
// @Param order_by query string false "Order by field (default: created_at)"
// @Param order query string false "Order direction (asc or desc, default: desc)"
// @Param typeFilter query int false "Filter by transaction type"
// @Success 200 {object} types.APIResponse{data=[]investmentv1.InvestmentTransaction}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/investments/{id}/transactions [get]
func (h *InvestmentHandlers) ListTransactions(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Parse investment ID
	investmentID, err := parseIDParam(c, "id")
	if err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Build request
	var req investmentv1.ListInvestmentTransactionsRequest
	req.InvestmentId = investmentID

	// Parse pagination parameters
	pagination := parsePaginationParams(c)
	req.Pagination = &investmentv1.PaginationParams{
		Page:     int32(pagination.Page),
		PageSize: int32(pagination.PageSize),
		OrderBy:  pagination.OrderBy,
		Order:    pagination.Order,
	}

	// Parse type filter if provided
	if typeFilterStr := c.Query("typeFilter"); typeFilterStr != "" {
		typeFilter, err := strconv.ParseInt(typeFilterStr, 10, 32)
		if err != nil {
			handler.BadRequest(c, apperrors.NewValidationError("invalid typeFilter parameter"))
			return
		}
		req.TypeFilter = investmentv1.InvestmentTransactionType(typeFilter)
	}

	// Call service
	result, err := h.investmentService.ListTransactions(c.Request.Context(), userID, &req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// EditTransaction edits an existing transaction.
// @Summary Edit an investment transaction
// @Tags investments
// @Accept json
// @Produce json
// @Param id path int true "Transaction ID"
// @Param request body investmentv1.EditInvestmentTransactionRequest true "Transaction edit request"
// @Success 200 {object} types.APIResponse{data=investmentv1.InvestmentTransaction}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 403 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/investment-transactions/{id} [put]
func (h *InvestmentHandlers) EditTransaction(c *gin.Context) {
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
	var req investmentv1.EditInvestmentTransactionRequest
	if err := handler.BindAndValidate(c, &req); err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Set ID from path parameter
	req.Id = transactionID

	// Validate quantity
	if req.Quantity <= 0 {
		handler.BadRequest(c, apperrors.NewValidationError("quantity must be positive"))
		return
	}

	// Validate price
	if req.Price <= 0 {
		handler.BadRequest(c, apperrors.NewValidationError("price must be positive"))
		return
	}

	// Validate fees
	if req.Fees < 0 {
		handler.BadRequest(c, apperrors.NewValidationError("fees cannot be negative"))
		return
	}

	// Set default transaction date if not provided
	if req.TransactionDate == 0 {
		req.TransactionDate = time.Now().Unix()
	}

	// Call service
	result, err := h.investmentService.EditTransaction(c.Request.Context(), transactionID, userID, &req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// DeleteTransaction deletes a transaction.
// @Summary Delete an investment transaction
// @Tags investments
// @Produce json
// @Param id path int true "Transaction ID"
// @Success 200 {object} types.APIResponse{data=investmentv1.DeleteInvestmentTransactionResponse}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 403 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/investment-transactions/{id} [delete]
func (h *InvestmentHandlers) DeleteTransaction(c *gin.Context) {
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
	result, err := h.investmentService.DeleteTransaction(c.Request.Context(), transactionID, userID)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// GetPortfolioSummary retrieves portfolio summary for a wallet.
// @Summary Get portfolio summary for a wallet
// @Tags investments
// @Produce json
// @Param id path int true "Wallet ID"
// @Success 200 {object} types.APIResponse{data=investmentv1.PortfolioSummary}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/wallets/{id}/portfolio-summary [get]
func (h *InvestmentHandlers) GetPortfolioSummary(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Parse wallet ID
	walletID, err := parseIDParam(c, "id")
	if err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Call service
	result, err := h.investmentService.GetPortfolioSummary(c.Request.Context(), walletID, userID)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// UpdatePrices updates current prices for investments.
// @Summary Update current prices for investments
// @Tags investments
// @Accept json
// @Produce json
// @Param request body investmentv1.UpdatePricesRequest true "Update prices request"
// @Success 200 {object} types.APIResponse{data=investmentv1.UpdatePricesResponse}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/investments/update-prices [post]
func (h *InvestmentHandlers) UpdatePrices(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Bind and validate request
	var req investmentv1.UpdatePricesRequest
	if err := handler.BindAndValidate(c, &req); err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Call service
	result, err := h.investmentService.UpdatePrices(c.Request.Context(), userID, &req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// SearchSymbols searches for investment symbols by query.
// @Summary Search for investment symbols
// @Tags investments
// @Produce json
// @Param query query string true "Search query"
// @Param limit query int false "Max results (default: 10, max: 20)"
// @Success 200 {object} types.APIResponse{data=investmentv1.SearchSymbolsResponse}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/investments/symbols/search [get]
func (h *InvestmentHandlers) SearchSymbols(c *gin.Context) {
	// Get user ID from context
	_, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Get query parameter
	query := c.Query("query")
	if query == "" {
		handler.BadRequest(c, apperrors.NewValidationError("query parameter is required"))
		return
	}

	// Get limit parameter
	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	if limit > 20 {
		limit = 20
	}

	// Call service
	result, err := h.investmentService.SearchSymbols(c.Request.Context(), query, limit)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// ListUserInvestments lists all investments across all user's investment wallets.
// @Summary List all user investments across all wallets
// @Tags investments
// @Produce json
// @Param page query int false "Page number (default: 1)"
// @Param page_size query int false "Page size (default: 100, max: 100)"
// @Param order_by query string false "Order by field (default: symbol)"
// @Param order query string false "Order direction (asc or desc, default: asc)"
// @Param typeFilter query int false "Filter by investment type"
// @Param walletId query int false "Filter by specific wallet (optional)"
// @Success 200 {object} types.APIResponse{data=investmentv1.ListUserInvestmentsResponse}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/investments [get]
func (h *InvestmentHandlers) ListUserInvestments(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Build request
	var req investmentv1.ListUserInvestmentsRequest

	// Parse pagination parameters
	pagination := parsePaginationParams(c)
	req.Pagination = &investmentv1.PaginationParams{
		Page:     int32(pagination.Page),
		PageSize: int32(pagination.PageSize),
		OrderBy:  pagination.OrderBy,
		Order:    pagination.Order,
	}

	// Parse optional walletId (support both snake_case and camelCase)
	walletIDStr := c.Query("walletId")
	if walletIDStr == "" {
		walletIDStr = c.Query("wallet_id") // Fallback to snake_case
	}
	if walletIDStr != "" {
		walletID, err := strconv.ParseInt(walletIDStr, 10, 32)
		if err != nil {
			handler.BadRequest(c, apperrors.NewValidationError("invalid walletId parameter"))
			return
		}
		req.WalletId = int32(walletID)
	}

	// Parse type filter if provided (support both snake_case and camelCase)
	typeFilterStr := c.Query("typeFilter")
	if typeFilterStr == "" {
		typeFilterStr = c.Query("type_filter") // Fallback to snake_case
	}
	if typeFilterStr != "" {
		typeFilter, err := strconv.ParseInt(typeFilterStr, 10, 32)
		if err != nil {
			handler.BadRequest(c, apperrors.NewValidationError("invalid typeFilter parameter"))
			return
		}
		req.TypeFilter = investmentv1.InvestmentType(typeFilter)
	}

	// Call service
	result, err := h.investmentService.ListUserInvestments(c.Request.Context(), userID, &req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// GetAggregatedPortfolioSummary retrieves aggregated portfolio summary across all investment wallets.
// @Summary Get aggregated portfolio summary
// @Tags investments
// @Produce json
// @Param walletId query int false "Filter by specific wallet (optional, 0 or omitted = all wallets)"
// @Param typeFilter query int false "Filter by investment type"
// @Success 200 {object} types.APIResponse{data=investmentv1.PortfolioSummary}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/portfolio-summary [get]
func (h *InvestmentHandlers) GetAggregatedPortfolioSummary(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Build request
	var req investmentv1.GetAggregatedPortfolioSummaryRequest

	// Parse optional walletId (support both snake_case and camelCase)
	walletIDStr := c.Query("walletId")
	if walletIDStr == "" {
		walletIDStr = c.Query("wallet_id") // Fallback to snake_case
	}
	if walletIDStr != "" {
		walletID, err := strconv.ParseInt(walletIDStr, 10, 32)
		if err != nil {
			handler.BadRequest(c, apperrors.NewValidationError("invalid walletId parameter"))
			return
		}
		req.WalletId = int32(walletID)
	}

	// Parse type filter if provided (support both snake_case and camelCase)
	typeFilterStr := c.Query("typeFilter")
	if typeFilterStr == "" {
		typeFilterStr = c.Query("type_filter") // Fallback to snake_case
	}
	if typeFilterStr != "" {
		typeFilter, err := strconv.ParseInt(typeFilterStr, 10, 32)
		if err != nil {
			handler.BadRequest(c, apperrors.NewValidationError("invalid typeFilter parameter"))
			return
		}
		req.TypeFilter = investmentv1.InvestmentType(typeFilter)
	}

	// Call service
	result, err := h.investmentService.GetAggregatedPortfolioSummary(c.Request.Context(), userID, &req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}
