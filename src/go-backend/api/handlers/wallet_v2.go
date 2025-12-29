package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"wealthjourney/internal/service"
	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/handler"
	"wealthjourney/pkg/types"
	"wealthjourney/pkg/validator"
)

// WalletHandlers handles wallet-related HTTP requests.
type WalletHandlers struct {
	walletService service.WalletService
}

// NewWalletHandlers creates a new WalletHandlers instance.
func NewWalletHandlers(walletService service.WalletService) *WalletHandlers {
	return &WalletHandlers{
		walletService: walletService,
	}
}

// CreateWallet creates a new wallet.
// @Summary Create a new wallet
// @Tags wallets
// @Accept json
// @Produce json
// @Param request body service.CreateWalletRequest true "Wallet creation request"
// @Success 201 {object} types.APIResponse{data=service.WalletDTO}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/wallets [post]
func (h *WalletHandlers) CreateWallet(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Bind and validate request
	var req service.CreateWalletRequest
	if err := handler.BindAndValidate(c, &req); err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Validate wallet name
	if err := validator.WalletName(req.WalletName); err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Set default currency if not provided
	if req.InitialBalance.Currency == "" {
		req.InitialBalance.Currency = types.USD
	}

	// Call service
	result, err := h.walletService.CreateWallet(c.Request.Context(), userID, req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Created(c, result)
}

// ListWallets lists all wallets for the authenticated user.
// @Summary List user wallets
// @Tags wallets
// @Produce json
// @Param page query int false "Page number (default: 1)"
// @Param page_size query int false "Page size (default: 20, max: 100)"
// @Param order_by query string false "Order by field (default: created_at)"
// @Param order query string false "Order direction (asc or desc, default: desc)"
// @Success 200 {object} types.APIResponse{data=service.WalletListResult}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/wallets [get]
func (h *WalletHandlers) ListWallets(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Parse pagination parameters
	params := parsePaginationParams(c)

	// Call service
	result, err := h.walletService.ListWallets(c.Request.Context(), userID, params)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// GetWallet retrieves a wallet by ID.
// @Summary Get a wallet
// @Tags wallets
// @Produce json
// @Param id path int true "Wallet ID"
// @Success 200 {object} types.APIResponse{data=service.WalletDTO}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 403 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/wallets/{id} [get]
func (h *WalletHandlers) GetWallet(c *gin.Context) {
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
	result, err := h.walletService.GetWallet(c.Request.Context(), walletID, userID)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// UpdateWallet updates a wallet's name.
// @Summary Update a wallet
// @Tags wallets
// @Accept json
// @Produce json
// @Param id path int true "Wallet ID"
// @Param request body service.UpdateWalletRequest true "Wallet update request"
// @Success 200 {object} types.APIResponse{data=service.WalletDTO}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 403 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/wallets/{id} [put]
func (h *WalletHandlers) UpdateWallet(c *gin.Context) {
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

	// Bind and validate request
	var req service.UpdateWalletRequest
	if err := handler.BindAndValidate(c, &req); err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Call service
	result, err := h.walletService.UpdateWallet(c.Request.Context(), walletID, userID, req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// DeleteWallet deletes a wallet.
// @Summary Delete a wallet
// @Tags wallets
// @Produce json
// @Param id path int true "Wallet ID"
// @Success 204
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 403 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/wallets/{id} [delete]
func (h *WalletHandlers) DeleteWallet(c *gin.Context) {
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
	if err := h.walletService.DeleteWallet(c.Request.Context(), walletID, userID); err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.NoContent(c)
}

// AddFunds adds funds to a wallet.
// @Summary Add funds to a wallet
// @Tags wallets
// @Accept json
// @Produce json
// @Param id path int true "Wallet ID"
// @Param request body service.AddFundsRequest true "Add funds request"
// @Success 200 {object} types.APIResponse{data=service.WalletDTO}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 403 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/wallets/{id}/add [post]
func (h *WalletHandlers) AddFunds(c *gin.Context) {
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

	// Bind and validate request
	var req service.AddFundsRequest
	if err := handler.BindAndValidate(c, &req); err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Call service
	result, err := h.walletService.AddFunds(c.Request.Context(), walletID, userID, req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// WithdrawFunds withdraws funds from a wallet.
// @Summary Withdraw funds from a wallet
// @Tags wallets
// @Accept json
// @Produce json
// @Param id path int true "Wallet ID"
// @Param request body service.WithdrawFundsRequest true "Withdraw funds request"
// @Success 200 {object} types.APIResponse{data=service.WalletDTO}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 403 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/wallets/{id}/withdraw [post]
func (h *WalletHandlers) WithdrawFunds(c *gin.Context) {
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

	// Bind and validate request
	var req service.WithdrawFundsRequest
	if err := handler.BindAndValidate(c, &req); err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Call service
	result, err := h.walletService.WithdrawFunds(c.Request.Context(), walletID, userID, req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// TransferFunds transfers funds between two wallets.
// @Summary Transfer funds between wallets
// @Tags wallets
// @Accept json
// @Produce json
// @Param request body service.TransferFundsRequest true "Transfer funds request"
// @Success 200 {object} types.APIResponse{data=service.TransferResult}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 403 {object} types.APIResponse
// @Failure 404 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/wallets/transfer [post]
func (h *WalletHandlers) TransferFunds(c *gin.Context) {
	// Get user ID from context
	userID, ok := handler.GetUserID(c)
	if !ok {
		handler.Unauthorized(c, "User not authenticated")
		return
	}

	// Bind and validate request
	var req service.TransferFundsRequest
	if err := handler.BindAndValidate(c, &req); err != nil {
		handler.BadRequest(c, err)
		return
	}

	// Call service
	result, err := h.walletService.TransferFunds(c.Request.Context(), userID, req)
	if err != nil {
		handler.HandleError(c, err)
		return
	}

	handler.Success(c, result)
}

// parseIDParam parses an ID parameter from the URL.
func parseIDParam(c *gin.Context, param string) (int32, error) {
	idStr := c.Param(param)
	id, err := strconv.ParseInt(idStr, 10, 32)
	if err != nil {
		return 0, apperrors.NewValidationError("invalid " + param + " parameter")
	}
	return int32(id), nil
}

// parsePaginationParams parses pagination parameters from the query string.
func parsePaginationParams(c *gin.Context) types.PaginationParams {
	params := types.NewPaginationParams()

	if pageStr := c.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil {
			params.Page = page
		}
	}

	if pageSizeStr := c.Query("page_size"); pageSizeStr != "" {
		if pageSize, err := strconv.Atoi(pageSizeStr); err == nil {
			params.PageSize = pageSize
		}
	}

	if orderBy := c.Query("order_by"); orderBy != "" {
		params.OrderBy = orderBy
	}

	if order := c.Query("order"); order != "" {
		params.Order = order
	}

	return params.Validate()
}
