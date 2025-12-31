package grpcserver

import (
	"context"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	commonv1 "wealthjourney/gen/common/v1"
	walletv1 "wealthjourney/gen/wallet/v1"
	"wealthjourney/internal/service"
	"wealthjourney/pkg/types"
)

// walletServer implements the WalletService gRPC interface
type walletServer struct {
	walletv1.UnimplementedWalletServiceServer
	walletService service.WalletService
}

// NewWalletServer creates a new WalletService gRPC server
func NewWalletServer(walletService service.WalletService) walletv1.WalletServiceServer {
	return &walletServer{
		walletService: walletService,
	}
}

// domainWalletToProto converts a domain WalletDTO to proto Wallet
func domainWalletToProto(wallet *service.WalletDTO) *walletv1.Wallet {
	return &walletv1.Wallet{
		Id:         wallet.ID,
		UserId:     wallet.UserID,
		WalletName: wallet.WalletName,
		Balance: &commonv1.Money{
			Amount:   wallet.Balance.Amount,
			Currency: wallet.Balance.Currency,
		},
		CreatedAt: wallet.CreatedAt.Unix(),
		UpdatedAt: wallet.UpdatedAt.Unix(),
	}
}

// GetWallet retrieves a wallet by ID
func (s *walletServer) GetWallet(ctx context.Context, req *walletv1.GetWalletRequest) (*walletv1.GetWalletResponse, error) {
	if req.WalletId == 0 {
		return nil, status.Error(codes.InvalidArgument, "wallet_id is required")
	}

	// Get user ID from context (set by auth interceptor)
	userID, ok := ctx.Value("user_id").(int32)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	wallet, err := s.walletService.GetWallet(ctx, req.WalletId, userID)
	if err != nil {
		return nil, status.Error(codes.NotFound, err.Error())
	}

	return &walletv1.GetWalletResponse{
		Success:   true,
		Data:      domainWalletToProto(wallet),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// ListWallets retrieves all wallets for authenticated user with pagination
func (s *walletServer) ListWallets(ctx context.Context, req *walletv1.ListWalletsRequest) (*walletv1.ListWalletsResponse, error) {
	// Get user ID from context (set by auth interceptor)
	userID, ok := ctx.Value("user_id").(int32)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	params := ProtoPaginationParams(req.GetPagination())

	result, err := s.walletService.ListWallets(ctx, userID, types.PaginationParams{
		Page:     params.Page,
		PageSize: params.PageSize,
		OrderBy:  params.OrderBy,
		Order:    params.Order,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	protoWallets := make([]*walletv1.Wallet, len(result.Wallets))
	for i := range result.Wallets {
		protoWallets[i] = domainWalletToProto(&result.Wallets[i])
	}

	return &walletv1.ListWalletsResponse{
		Success:    true,
		Wallets:    protoWallets,
		Pagination: DomainPaginationResult(result.Pagination),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// CreateWallet creates a new wallet
func (s *walletServer) CreateWallet(ctx context.Context, req *walletv1.CreateWalletRequest) (*walletv1.CreateWalletResponse, error) {
	if req.WalletName == "" {
		return nil, status.Error(codes.InvalidArgument, "wallet_name is required")
	}

	// Get user ID from context (set by auth interceptor)
	userID, ok := ctx.Value("user_id").(int32)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	createReq := service.CreateWalletRequest{
		WalletName: req.WalletName,
		InitialBalance: types.Money{
			Amount:   req.InitialBalance.Amount,
			Currency: req.InitialBalance.Currency,
		},
	}

	wallet, err := s.walletService.CreateWallet(ctx, userID, createReq)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &walletv1.CreateWalletResponse{
		Success:   true,
		Data:      domainWalletToProto(wallet),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// UpdateWallet updates wallet information
func (s *walletServer) UpdateWallet(ctx context.Context, req *walletv1.UpdateWalletRequest) (*walletv1.UpdateWalletResponse, error) {
	if req.WalletId == 0 {
		return nil, status.Error(codes.InvalidArgument, "wallet_id is required")
	}
	if req.WalletName == "" {
		return nil, status.Error(codes.InvalidArgument, "wallet_name is required")
	}

	// Get user ID from context (set by auth interceptor)
	userID, ok := ctx.Value("user_id").(int32)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	updateReq := service.UpdateWalletRequest{
		WalletName: req.WalletName,
	}

	wallet, err := s.walletService.UpdateWallet(ctx, req.WalletId, userID, updateReq)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &walletv1.UpdateWalletResponse{
		Success:   true,
		Data:      domainWalletToProto(wallet),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// DeleteWallet deletes a wallet
func (s *walletServer) DeleteWallet(ctx context.Context, req *walletv1.DeleteWalletRequest) (*walletv1.DeleteWalletResponse, error) {
	if req.WalletId == 0 {
		return nil, status.Error(codes.InvalidArgument, "wallet_id is required")
	}

	// Get user ID from context (set by auth interceptor)
	userID, ok := ctx.Value("user_id").(int32)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	err := s.walletService.DeleteWallet(ctx, req.WalletId, userID)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &walletv1.DeleteWalletResponse{
		Success:   true,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// AddFunds adds funds to a wallet
func (s *walletServer) AddFunds(ctx context.Context, req *walletv1.AddFundsRequest) (*walletv1.AddFundsResponse, error) {
	if req.WalletId == 0 {
		return nil, status.Error(codes.InvalidArgument, "wallet_id is required")
	}
	if req.Amount == nil {
		return nil, status.Error(codes.InvalidArgument, "amount is required")
	}

	// Get user ID from context (set by auth interceptor)
	userID, ok := ctx.Value("user_id").(int32)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	addReq := service.AddFundsRequest{
		Amount: types.Money{
			Amount:   req.Amount.Amount,
			Currency: req.Amount.Currency,
		},
	}

	wallet, err := s.walletService.AddFunds(ctx, req.WalletId, userID, addReq)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &walletv1.AddFundsResponse{
		Success:   true,
		Data:      domainWalletToProto(wallet),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// WithdrawFunds withdraws funds from a wallet
func (s *walletServer) WithdrawFunds(ctx context.Context, req *walletv1.WithdrawFundsRequest) (*walletv1.WithdrawFundsResponse, error) {
	if req.WalletId == 0 {
		return nil, status.Error(codes.InvalidArgument, "wallet_id is required")
	}
	if req.Amount == nil {
		return nil, status.Error(codes.InvalidArgument, "amount is required")
	}

	// Get user ID from context (set by auth interceptor)
	userID, ok := ctx.Value("user_id").(int32)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	withdrawReq := service.WithdrawFundsRequest{
		Amount: types.Money{
			Amount:   req.Amount.Amount,
			Currency: req.Amount.Currency,
		},
	}

	wallet, err := s.walletService.WithdrawFunds(ctx, req.WalletId, userID, withdrawReq)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &walletv1.WithdrawFundsResponse{
		Success:   true,
		Data:      domainWalletToProto(wallet),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// TransferFunds transfers funds between two wallets
func (s *walletServer) TransferFunds(ctx context.Context, req *walletv1.TransferFundsRequest) (*walletv1.TransferFundsResponse, error) {
	if req.FromWalletId == 0 {
		return nil, status.Error(codes.InvalidArgument, "from_wallet_id is required")
	}
	if req.ToWalletId == 0 {
		return nil, status.Error(codes.InvalidArgument, "to_wallet_id is required")
	}
	if req.Amount == nil {
		return nil, status.Error(codes.InvalidArgument, "amount is required")
	}

	// Get user ID from context (set by auth interceptor)
	userID, ok := ctx.Value("user_id").(int32)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	transferReq := service.TransferFundsRequest{
		FromWalletID: req.FromWalletId,
		ToWalletID:   req.ToWalletId,
		Amount: types.Money{
			Amount:   req.Amount.Amount,
			Currency: req.Amount.Currency,
		},
	}

	result, err := s.walletService.TransferFunds(ctx, userID, transferReq)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &walletv1.TransferFundsResponse{
		Success:    true,
		FromWallet: domainWalletToProto(&result.FromWallet),
		ToWallet:   domainWalletToProto(&result.ToWallet),
		Amount: &commonv1.Money{
			Amount:   result.Amount.Amount,
			Currency: result.Amount.Currency,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}
