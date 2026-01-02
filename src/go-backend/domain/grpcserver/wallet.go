package grpcserver

import (
	"context"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	protobufv1 "wealthjourney/gen/protobuf/v1"
	"wealthjourney/domain/service"
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

	wallet, err := s.walletService.GetWallet(ctx, req.WalletId, userID)
	if err != nil {
		return nil, status.Error(codes.NotFound, err.Error())
	}

	return &protobufv1.GetWalletResponse{
		Success:   true,
		Data:      wallet,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
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

	result, err := s.walletService.ListWallets(ctx, userID, params)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &protobufv1.ListWalletsResponse{
		Success:    true,
		Wallets:    result.Wallets,
		Pagination: result.Pagination,
		Timestamp:  time.Now().Format(time.RFC3339),
	}, nil
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

	wallet, err := s.walletService.CreateWallet(ctx, userID, req)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &protobufv1.CreateWalletResponse{
		Success:   true,
		Data:      wallet,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
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

	wallet, err := s.walletService.UpdateWallet(ctx, req.WalletId, userID, req)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &protobufv1.UpdateWalletResponse{
		Success:   true,
		Data:      wallet,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
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

	err := s.walletService.DeleteWallet(ctx, req.WalletId, userID)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &protobufv1.DeleteWalletResponse{
		Success:   true,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
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

	wallet, err := s.walletService.AddFunds(ctx, req.WalletId, userID, req)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &protobufv1.AddFundsResponse{
		Success:   true,
		Data:      wallet,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
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

	wallet, err := s.walletService.WithdrawFunds(ctx, req.WalletId, userID, req)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &protobufv1.WithdrawFundsResponse{
		Success:   true,
		Data:      wallet,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
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

	result, err := s.walletService.TransferFunds(ctx, userID, req)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &protobufv1.TransferFundsResponse{
		Success:    true,
		FromWallet: result.FromWallet,
		ToWallet:   result.ToWallet,
		Amount:     result.Amount,
		Timestamp:  time.Now().Format(time.RFC3339),
	}, nil
}
