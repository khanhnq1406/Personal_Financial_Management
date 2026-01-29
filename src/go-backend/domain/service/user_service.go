package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"wealthjourney/domain/models"
	"wealthjourney/domain/repository"
	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/cache"
	"wealthjourney/pkg/types"
	"wealthjourney/pkg/validator"
	protobufv1 "wealthjourney/protobuf/v1"
	v1 "wealthjourney/protobuf/v1"
)

const (
	// batchSize is the number of entities to process in a single transaction during currency conversion
	batchSize = 100
	// conversionTimeout is the maximum time allowed for currency conversion
	conversionTimeout = 30 * time.Minute
)

// userService implements UserService.
type userService struct {
	userRepo         repository.UserRepository
	categorySvc      CategoryService
	walletRepo       repository.WalletRepository
	transactionRepo  repository.TransactionRepository
	budgetRepo       repository.BudgetRepository
	budgetItemRepo   repository.BudgetItemRepository
	investmentRepo   repository.InvestmentRepository
	fxRateSvc        FXRateService
	currencyCache    *cache.CurrencyCache
	mapper           *UserMapper
}

// NewUserService creates a new UserService.
func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{
		userRepo:        userRepo,
		categorySvc:     nil, // Set later to avoid circular dependency
		walletRepo:      nil, // Set later via SetRepositories
		transactionRepo: nil, // Set later via SetRepositories
		budgetRepo:      nil, // Set later via SetRepositories
		budgetItemRepo:  nil, // Set later via SetRepositories
		investmentRepo:  nil, // Set later via SetRepositories
		fxRateSvc:       nil, // Set later via SetRepositories
		currencyCache:   nil, // Set later via SetRepositories
		mapper:          NewUserMapper(),
	}
}

// SetRepositories sets the repositories and services needed for currency conversion.
// This is called after initialization to avoid circular dependencies.
func (s *userService) SetRepositories(
	walletRepo repository.WalletRepository,
	transactionRepo repository.TransactionRepository,
	budgetRepo repository.BudgetRepository,
	budgetItemRepo repository.BudgetItemRepository,
	investmentRepo repository.InvestmentRepository,
	fxRateSvc FXRateService,
	currencyCache *cache.CurrencyCache,
) {
	s.walletRepo = walletRepo
	s.transactionRepo = transactionRepo
	s.budgetRepo = budgetRepo
	s.budgetItemRepo = budgetItemRepo
	s.investmentRepo = investmentRepo
	s.fxRateSvc = fxRateSvc
	s.currencyCache = currencyCache
}

// SetCategoryService sets the category service (called after initialization to avoid circular dependency).
func (s *userService) SetCategoryService(categorySvc CategoryService) {
	s.categorySvc = categorySvc
}

// GetUser retrieves a user by ID.
func (s *userService) GetUser(ctx context.Context, userID int32) (*protobufv1.GetUserResponse, error) {
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &protobufv1.GetUserResponse{
		Success:   true,
		Message:   "User retrieved successfully",
		Data:      s.mapper.ModelToProto(user),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// GetUserByEmail retrieves a user by email.
func (s *userService) GetUserByEmail(ctx context.Context, email string) (*protobufv1.GetUserByEmailResponse, error) {
	if err := validator.Email(email); err != nil {
		return nil, err
	}

	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	return &protobufv1.GetUserByEmailResponse{
		Success:   true,
		Message:   "User retrieved successfully",
		Data:      s.mapper.ModelToProto(user),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// ListUsers retrieves all users with pagination.
func (s *userService) ListUsers(ctx context.Context, params types.PaginationParams) (*protobufv1.ListUsersResponse, error) {
	params = params.Validate()

	opts := repository.ListOptions{
		Limit:   params.Limit(),
		Offset:  params.Offset(),
		OrderBy: params.OrderBy,
		Order:   params.Order,
	}

	users, total, err := s.userRepo.List(ctx, opts)
	if err != nil {
		return nil, err
	}

	pagination := types.NewPaginationResult(params.Page, params.PageSize, total)

	return &protobufv1.ListUsersResponse{
		Success:    true,
		Message:    "Users retrieved successfully",
		Users:      s.mapper.ModelSliceToProto(users),
		Pagination: s.mapper.PaginationResultToProto(pagination),
		Timestamp:  time.Now().Format(time.RFC3339),
	}, nil
}

// CreateUser creates a new user.
func (s *userService) CreateUser(ctx context.Context, email, name, picture string) (*protobufv1.CreateUserResponse, error) {
	// Validate inputs
	if err := validator.Email(email); err != nil {
		return nil, err
	}
	if name != "" {
		if err := validator.Name(name); err != nil {
			return nil, err
		}
	}

	// Check if user already exists
	exists, err := s.userRepo.ExistsByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, apperrors.NewConflictError("user with this email already exists")
	}

	// Create user model
	user := &models.User{
		Email:   email,
		Name:    name,
		Picture: picture,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	// Create default categories for the new user
	if s.categorySvc != nil {
		if err := s.categorySvc.CreateDefaultCategories(ctx, user.ID); err != nil {
			// Log the error but don't fail the user creation
			// The categories can be created manually later
		}
	}

	return &protobufv1.CreateUserResponse{
		Success:   true,
		Message:   "User created successfully",
		Data:      s.mapper.ModelToProto(user),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// UpdateUser updates a user's information.
func (s *userService) UpdateUser(ctx context.Context, userID int32, email, name, picture string) (*protobufv1.UpdateUserResponse, error) {
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Get existing user
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Validate and update email if provided
	if email != "" && email != user.Email {
		if err := validator.Email(email); err != nil {
			return nil, err
		}
		// Check if email is already taken
		exists, err := s.userRepo.ExistsByEmail(ctx, email)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, apperrors.NewConflictError("email already in use")
		}
		user.Email = email
	}

	// Validate and update name if provided
	if name != "" {
		if err := validator.Name(name); err != nil {
			return nil, err
		}
		user.Name = name
	}

	// Update picture if provided
	if picture != "" {
		user.Picture = picture
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	return &protobufv1.UpdateUserResponse{
		Success:   true,
		Message:   "User updated successfully",
		Data:      s.mapper.ModelToProto(user),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// DeleteUser deletes a user.
func (s *userService) DeleteUser(ctx context.Context, userID int32) (*protobufv1.DeleteUserResponse, error) {
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	if err := s.userRepo.Delete(ctx, userID); err != nil {
		return nil, err
	}

	return &protobufv1.DeleteUserResponse{
		Success:   true,
		Message:   "User deleted successfully",
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// ExistsByEmail checks if a user exists by email.
func (s *userService) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	if err := validator.Email(email); err != nil {
		return false, err
	}
	return s.userRepo.ExistsByEmail(ctx, email)
}

// UpdateUserPreferences updates a user's preferences, including currency.
// If currency is changed, it triggers a background job to convert all monetary values.
func (s *userService) UpdateUserPreferences(ctx context.Context, userID int32, preferredCurrency string) (*protobufv1.UpdateUserResponse, error) {
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Validate the new currency
	if preferredCurrency != "" && !s.fxRateSvc.IsSupportedCurrency(preferredCurrency) {
		return nil, apperrors.NewValidationError(fmt.Sprintf("unsupported currency: %s", preferredCurrency))
	}

	// Get existing user
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Check if currency is actually changing
	oldCurrency := user.PreferredCurrency
	if oldCurrency == preferredCurrency || preferredCurrency == "" {
		return &protobufv1.UpdateUserResponse{
			Success:   true,
			Message:   "No currency change needed",
			Data:      s.mapper.ModelToProto(user),
			Timestamp: time.Now().Format(time.RFC3339),
		}, nil
	}

	// Check if a conversion is already in progress
	if user.ConversionInProgress {
		return nil, apperrors.NewConflictError("currency conversion already in progress")
	}

	// Validate that we can get the FX rate for this pair
	rate, err := s.fxRateSvc.GetRate(ctx, oldCurrency, preferredCurrency)
	if err != nil {
		return nil, apperrors.NewValidationError(fmt.Sprintf("cannot get exchange rate from %s to %s: %w", oldCurrency, preferredCurrency, err))
	}
	if rate == 0 {
		return nil, apperrors.NewValidationError("invalid exchange rate returned")
	}

	// Update user's preferred currency and set conversion flag
	user.PreferredCurrency = preferredCurrency
	user.ConversionInProgress = true

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to update user preferences: %w", err)
	}

	// Trigger background job for currency conversion
	// In production, this should be handled by a proper job queue (e.g., Redis Queue, RabbitMQ)
	// For now, we'll run it in a goroutine with proper error handling
	go s.convertUserCurrency(context.Background(), userID, oldCurrency, preferredCurrency)

	return &protobufv1.UpdateUserResponse{
		Success:   true,
		Message:   fmt.Sprintf("Currency conversion from %s to %s has started. You will be notified when complete.", oldCurrency, preferredCurrency),
		Data:      s.mapper.ModelToProto(user),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// convertUserCurrency is a background job that converts all monetary values for a user.
// It processes wallets, transactions, budgets, and investments in batches.
func (s *userService) convertUserCurrency(ctx context.Context, userID int32, fromCurrency, toCurrency string) {
	log.Printf("Starting currency conversion for user %d: %s -> %s", userID, fromCurrency, toCurrency)

	// Create a timeout context for the entire conversion process
	timeoutCtx, cancel := context.WithTimeout(ctx, conversionTimeout)
	defer cancel()

	// Track any errors that occur during conversion
	var conversionErrors []error

	// Step 1: Convert all wallet balances
	if err := s.convertWalletCurrencies(timeoutCtx, userID, fromCurrency, toCurrency); err != nil {
		log.Printf("Error converting wallet currencies for user %d: %v", userID, err)
		conversionErrors = append(conversionErrors, fmt.Errorf("wallets: %w", err))
	}

	// Step 2: Convert all transactions
	if err := s.convertTransactionCurrencies(timeoutCtx, userID, fromCurrency, toCurrency); err != nil {
		log.Printf("Error converting transaction currencies for user %d: %v", userID, err)
		conversionErrors = append(conversionErrors, fmt.Errorf("transactions: %w", err))
	}

	// Step 3: Convert all budgets and budget items
	if err := s.convertBudgetCurrencies(timeoutCtx, userID, fromCurrency, toCurrency); err != nil {
		log.Printf("Error converting budget currencies for user %d: %v", userID, err)
		conversionErrors = append(conversionErrors, fmt.Errorf("budgets: %w", err))
	}

	// Step 4: Convert all investments
	if err := s.convertInvestmentCurrencies(timeoutCtx, userID, fromCurrency, toCurrency); err != nil {
		log.Printf("Error converting investment currencies for user %d: %v", userID, err)
		conversionErrors = append(conversionErrors, fmt.Errorf("investments: %w", err))
	}

	// Step 5: Clear all currency cache for this user
	if s.currencyCache != nil {
		if err := s.currencyCache.DeleteUserCache(timeoutCtx, userID); err != nil {
			log.Printf("Error clearing currency cache for user %d: %v", userID, err)
			// Don't fail the conversion if cache cleanup fails
		} else {
			log.Printf("Cleared currency cache for user %d", userID)
		}
	}

	// Final step: Clear the conversion in progress flag
	user, err := s.userRepo.GetByID(timeoutCtx, userID)
	if err != nil {
		log.Printf("Error getting user %d to clear conversion flag: %v", userID, err)
		return
	}

	user.ConversionInProgress = false
	if err := s.userRepo.Update(timeoutCtx, user); err != nil {
		log.Printf("Error clearing conversion in progress flag for user %d: %v", userID, err)
		return
	}

	// Log completion status
	if len(conversionErrors) > 0 {
		log.Printf("Currency conversion for user %d completed with %d error(s): %v", userID, len(conversionErrors), conversionErrors)
	} else {
		log.Printf("Currency conversion for user %d completed successfully", userID)
	}
}

// convertWalletCurrencies converts all wallet balances for a user in batches.
func (s *userService) convertWalletCurrencies(ctx context.Context, userID int32, fromCurrency, toCurrency string) error {
	if s.walletRepo == nil {
		return fmt.Errorf("wallet repository not available")
	}

	offset := 0
	totalProcessed := 0

	for {
		// Fetch a batch of wallets
		wallets, _, err := s.walletRepo.ListByUserID(ctx, userID, repository.ListOptions{
			Limit:  batchSize,
			Offset: offset,
		})
		if err != nil {
			return fmt.Errorf("failed to list wallets: %w", err)
		}

		if len(wallets) == 0 {
			break
		}

		// Convert each wallet in the batch
		for _, wallet := range wallets {
			// Convert the balance using the FX rate service
			convertedBalance, err := s.fxRateSvc.ConvertAmount(ctx, wallet.Balance, fromCurrency, toCurrency)
			if err != nil {
				log.Printf("Error converting wallet %d balance: %v", wallet.ID, err)
				continue // Continue with next wallet instead of failing entire batch
			}

			// Update wallet balance and currency
			wallet.Balance = convertedBalance
			wallet.Currency = toCurrency

			if err := s.walletRepo.Update(ctx, wallet); err != nil {
				log.Printf("Error updating wallet %d: %v", wallet.ID, err)
				continue
			}

			totalProcessed++
		}

		// Move to next batch
		offset += len(wallets)
	}

	log.Printf("Converted %d wallet(s) for user %d", totalProcessed, userID)
	return nil
}

// convertTransactionCurrencies converts all transaction amounts for a user in batches.
func (s *userService) convertTransactionCurrencies(ctx context.Context, userID int32, fromCurrency, toCurrency string) error {
	if s.transactionRepo == nil {
		return fmt.Errorf("transaction repository not available")
	}

	// Get all wallet IDs for the user to fetch transactions
	wallets, _, err := s.walletRepo.ListByUserID(ctx, userID, repository.ListOptions{
		Limit:  1000, // Large limit to get all wallets
		Offset: 0,
	})
	if err != nil {
		return fmt.Errorf("failed to list wallets: %w", err)
	}

	totalProcessed := 0

	// Process transactions for each wallet
	for _, wallet := range wallets {
		offset := 0

		for {
			// Use List with filter for wallet ID
			transactions, _, err := s.transactionRepo.List(ctx, userID, repository.TransactionFilter{
				WalletID: &wallet.ID,
			}, repository.ListOptions{
				Limit:  batchSize,
				Offset: offset,
			})
			if err != nil {
				log.Printf("Error listing transactions for wallet %d: %v", wallet.ID, err)
				break
			}

			if len(transactions) == 0 {
				break
			}

			// Convert each transaction in the batch
			for _, transaction := range transactions {
				// Convert the amount using the FX rate service
				convertedAmount, err := s.fxRateSvc.ConvertAmount(ctx, transaction.Amount, fromCurrency, toCurrency)
				if err != nil {
					log.Printf("Error converting transaction %d amount: %v", transaction.ID, err)
					continue
				}

				// Update transaction amount and currency
				transaction.Amount = convertedAmount
				transaction.Currency = toCurrency

				if err := s.transactionRepo.Update(ctx, transaction); err != nil {
					log.Printf("Error updating transaction %d: %v", transaction.ID, err)
					continue
				}

				totalProcessed++
			}

			offset += len(transactions)
		}
	}

	log.Printf("Converted %d transaction(s) for user %d", totalProcessed, userID)
	return nil
}

// convertBudgetCurrencies converts all budgets and budget items for a user in batches.
func (s *userService) convertBudgetCurrencies(ctx context.Context, userID int32, fromCurrency, toCurrency string) error {
	if s.budgetRepo == nil || s.budgetItemRepo == nil {
		return fmt.Errorf("budget repository not available")
	}

	offset := 0
	totalBudgetsProcessed := 0
	totalItemsProcessed := 0

	for {
		// Fetch a batch of budgets
		budgets, _, err := s.budgetRepo.ListByUserID(ctx, userID, repository.ListOptions{
			Limit:  batchSize,
			Offset: offset,
		})
		if err != nil {
			return fmt.Errorf("failed to list budgets: %w", err)
		}

		if len(budgets) == 0 {
			break
		}

		// Convert each budget in the batch
		for _, budget := range budgets {
			// Convert the total amount
			convertedTotal, err := s.fxRateSvc.ConvertAmount(ctx, budget.Total, fromCurrency, toCurrency)
			if err != nil {
				log.Printf("Error converting budget %d total: %v", budget.ID, err)
				continue
			}

			budget.Total = convertedTotal
			budget.Currency = toCurrency

			// Convert budget items using budgetItemRepo
			items, err := s.budgetItemRepo.ListByBudgetID(ctx, budget.ID)
			if err != nil {
				log.Printf("Error getting items for budget %d: %v", budget.ID, err)
			} else {
				for _, item := range items {
					convertedItemAmount, err := s.fxRateSvc.ConvertAmount(ctx, item.Total, fromCurrency, toCurrency)
					if err != nil {
						log.Printf("Error converting budget item %d amount: %v", item.ID, err)
						continue
					}

					item.Total = convertedItemAmount

					if err := s.budgetItemRepo.Update(ctx, item); err != nil {
						log.Printf("Error updating budget item %d: %v", item.ID, err)
						continue
					}

					totalItemsProcessed++
				}
			}

			if err := s.budgetRepo.Update(ctx, budget); err != nil {
				log.Printf("Error updating budget %d: %v", budget.ID, err)
				continue
			}

			totalBudgetsProcessed++
		}

		offset += len(budgets)
	}

	log.Printf("Converted %d budget(s) and %d budget item(s) for user %d", totalBudgetsProcessed, totalItemsProcessed, userID)
	return nil
}

// convertInvestmentCurrencies converts all investment values for a user in batches.
func (s *userService) convertInvestmentCurrencies(ctx context.Context, userID int32, fromCurrency, toCurrency string) error {
	if s.investmentRepo == nil {
		return fmt.Errorf("investment repository not available")
	}

	// Get all wallet IDs for the user
	wallets, _, err := s.walletRepo.ListByUserID(ctx, userID, repository.ListOptions{
		Limit:  1000,
		Offset: 0,
	})
	if err != nil {
		return fmt.Errorf("failed to list wallets: %w", err)
	}

	totalProcessed := 0

	// Process investments for each wallet
	for _, wallet := range wallets {
		offset := 0

		for {
			investments, _, err := s.investmentRepo.ListByWalletID(ctx, wallet.ID, repository.ListOptions{
				Limit:  batchSize,
				Offset: offset,
			}, v1.InvestmentType_INVESTMENT_TYPE_UNSPECIFIED)
			if err != nil {
				log.Printf("Error listing investments for wallet %d: %v", wallet.ID, err)
				break
			}

			if len(investments) == 0 {
				break
			}

			// Convert each investment in the batch
			for _, investment := range investments {
				// Convert TotalCost
				convertedTotalCost, err := s.fxRateSvc.ConvertAmount(ctx, investment.TotalCost, fromCurrency, toCurrency)
				if err != nil {
					log.Printf("Error converting investment %d total cost: %v", investment.ID, err)
					continue
				}

				// Convert CurrentValue
				convertedCurrentValue, err := s.fxRateSvc.ConvertAmount(ctx, investment.CurrentValue, fromCurrency, toCurrency)
				if err != nil {
					log.Printf("Error converting investment %d current value: %v", investment.ID, err)
					continue
				}

				// Convert RealizedPNL
				convertedRealizedPNL, err := s.fxRateSvc.ConvertAmount(ctx, investment.RealizedPNL, fromCurrency, toCurrency)
				if err != nil {
					log.Printf("Error converting investment %d realized PNL: %v", investment.ID, err)
					continue
				}

				// Update investment
				investment.TotalCost = convertedTotalCost
				investment.CurrentValue = convertedCurrentValue
				investment.RealizedPNL = convertedRealizedPNL
				investment.Currency = toCurrency

				if err := s.investmentRepo.Update(ctx, investment); err != nil {
					log.Printf("Error updating investment %d: %v", investment.ID, err)
					continue
				}

				totalProcessed++
			}

			offset += len(investments)
		}
	}

	log.Printf("Converted %d investment(s) for user %d", totalProcessed, userID)
	return nil
}
