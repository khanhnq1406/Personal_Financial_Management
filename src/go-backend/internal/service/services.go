package service

import (
	"wealthjourney/internal/repository"
)

// Services holds all service instances.
type Services struct {
	Wallet WalletService
	User   UserService
}

// NewServices creates all service instances.
func NewServices(repos *Repositories) *Services {
	return &Services{
		Wallet: NewWalletService(repos.Wallet, repos.User),
		User:   NewUserService(repos.User),
	}
}

// Repositories holds all repository instances.
type Repositories struct {
	Wallet repository.WalletRepository
	User   repository.UserRepository
}

// NewRepositories creates all repository instances.
func NewRepositories(repos *Repositories) *Repositories {
	return repos
}
