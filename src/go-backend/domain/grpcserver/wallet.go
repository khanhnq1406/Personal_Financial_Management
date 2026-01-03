package grpcserver

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"wealthjourney/domain/service"
	protobufv1 "wealthjourney/gen/protobuf/protobuf/v1"
)

// walletServer implements the WalletService gRPC interface
type walletServer struct {
	protobufv1.UnimplementedWalletServiceServer
	walletService service.WalletService
}

// NewWalletServer creates a new WalletService gRPC server
func NewWalletServer(walletService service.WalletService) protobufv1.WalletServiceServer {
	return &walletServer{
		walletService: walletService,
	}
}

// GetWallet retrieves a wallet by ID
func (s *walletServer) GetWallet(ctx context.Context, req *protobufv1.GetWalletRequest) (*protobufv1.GetWalletResponse, error) {
	if req.WalletId == 0 {
		return nil, status.Error(codes.InvalidArgument, "wallet_id is required")
	}

	// Get user ID from context (set by auth interceptor)
	userID, ok := ctx.Value("user_id").(int32)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	return s.walletService.GetWallet(ctx, req.WalletId, userID)
}

// ListWallets retrieves all wallets for authenticated user with pagination
func (s *walletServer) ListWallets(ctx context.Context, req *protobufv1.ListWalletsRequest) (*protobufv1.ListWalletsResponse, error) {
	// Get user ID from context (set by auth interceptor)
	userID, ok := ctx.Value("user_id").(int32)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	// Convert proto pagination params to service params
	params := service.ProtoToPaginationParams(req.GetPagination())

	return s.walletService.ListWallets(ctx, userID, params)
}

// CreateWallet creates a new wallet
func (s *walletServer) CreateWallet(ctx context.Context, req *protobufv1.CreateWalletRequest) (*protobufv1.CreateWalletResponse, error) {
	if req.WalletName == "" {
		return nil, status.Error(codes.InvalidArgument, "wallet_name is required")
	}

	// Get user ID from context (set by auth interceptor)
	userID, ok := ctx.Value("user_id").(int32)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	return s.walletService.CreateWallet(ctx, userID, req)
}

// UpdateWallet updates wallet information
func (s *walletServer) UpdateWallet(ctx context.Context, req *protobufv1.UpdateWalletRequest) (*protobufv1.UpdateWalletResponse, error) {
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

	return s.walletService.UpdateWallet(ctx, req.WalletId, userID, req)
}

// DeleteWallet deletes a wallet
func (s *walletServer) DeleteWallet(ctx context.Context, req *protobufv1.DeleteWalletRequest) (*protobufv1.DeleteWalletResponse, error) {
	if req.WalletId == 0 {
		return nil, status.Error(codes.InvalidArgument, "wallet_id is required")
	}

	// Get user ID from context (set by auth interceptor)
	userID, ok := ctx.Value("user_id").(int32)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	return s.walletService.DeleteWallet(ctx, req.WalletId, userID)
}

// AddFunds adds funds to a wallet
func (s *walletServer) AddFunds(ctx context.Context, req *protobufv1.AddFundsRequest) (*protobufv1.AddFundsResponse, error) {
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

	return s.walletService.AddFunds(ctx, req.WalletId, userID, req)
}

// WithdrawFunds withdraws funds from a wallet
func (s *walletServer) WithdrawFunds(ctx context.Context, req *protobufv1.WithdrawFundsRequest) (*protobufv1.WithdrawFundsResponse, error) {
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

	return s.walletService.WithdrawFunds(ctx, req.WalletId, userID, req)
}

// TransferFunds transfers funds between two wallets
func (s *walletServer) TransferFunds(ctx context.Context, req *protobufv1.TransferFundsRequest) (*protobufv1.TransferFundsResponse, error) {
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

	return s.walletService.TransferFunds(ctx, userID, req)
}
