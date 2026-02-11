package categorization

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"wealthjourney/domain/models"
	"wealthjourney/domain/repository"
	v1 "wealthjourney/protobuf/v1"
)

// Mock repositories for testing
type mockMerchantRepo struct {
	mock.Mock
}

func (m *mockMerchantRepo) Create(ctx context.Context, rule *models.MerchantCategoryRule) error {
	args := m.Called(ctx, rule)
	return args.Error(0)
}

func (m *mockMerchantRepo) GetByID(ctx context.Context, id int32) (*models.MerchantCategoryRule, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.MerchantCategoryRule), args.Error(1)
}

func (m *mockMerchantRepo) ListActive(ctx context.Context, region string) ([]*models.MerchantCategoryRule, error) {
	args := m.Called(ctx, region)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.MerchantCategoryRule), args.Error(1)
}

func (m *mockMerchantRepo) IncrementUsageCount(ctx context.Context, id int32) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *mockMerchantRepo) Update(ctx context.Context, rule *models.MerchantCategoryRule) error {
	args := m.Called(ctx, rule)
	return args.Error(0)
}

func (m *mockMerchantRepo) Delete(ctx context.Context, id int32) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

type mockKeywordRepo struct {
	mock.Mock
}

func (m *mockKeywordRepo) Create(ctx context.Context, keyword *models.CategoryKeyword) error {
	args := m.Called(ctx, keyword)
	return args.Error(0)
}

func (m *mockKeywordRepo) GetByID(ctx context.Context, id int32) (*models.CategoryKeyword, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.CategoryKeyword), args.Error(1)
}

func (m *mockKeywordRepo) ListActive(ctx context.Context) ([]*models.CategoryKeyword, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.CategoryKeyword), args.Error(1)
}

func (m *mockKeywordRepo) ListByCategoryID(ctx context.Context, categoryID int32) ([]*models.CategoryKeyword, error) {
	args := m.Called(ctx, categoryID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.CategoryKeyword), args.Error(1)
}

func (m *mockKeywordRepo) Update(ctx context.Context, keyword *models.CategoryKeyword) error {
	args := m.Called(ctx, keyword)
	return args.Error(0)
}

func (m *mockKeywordRepo) Delete(ctx context.Context, id int32) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *mockKeywordRepo) BulkCreate(ctx context.Context, keywords []*models.CategoryKeyword) error {
	args := m.Called(ctx, keywords)
	return args.Error(0)
}

type mockUserMappingRepo struct {
	mock.Mock
}

func (m *mockUserMappingRepo) Create(ctx context.Context, mapping *models.UserCategoryMapping) error {
	args := m.Called(ctx, mapping)
	return args.Error(0)
}

func (m *mockUserMappingRepo) GetByID(ctx context.Context, id int32) (*models.UserCategoryMapping, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.UserCategoryMapping), args.Error(1)
}

func (m *mockUserMappingRepo) GetByUserIDAndPattern(ctx context.Context, userID int32, pattern string) (*models.UserCategoryMapping, error) {
	args := m.Called(ctx, userID, pattern)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.UserCategoryMapping), args.Error(1)
}

func (m *mockUserMappingRepo) ListByUserID(ctx context.Context, userID int32) ([]*models.UserCategoryMapping, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.UserCategoryMapping), args.Error(1)
}

func (m *mockUserMappingRepo) CreateOrUpdate(ctx context.Context, mapping *models.UserCategoryMapping) error {
	args := m.Called(ctx, mapping)
	return args.Error(0)
}

func (m *mockUserMappingRepo) UpdateLastUsed(ctx context.Context, id int32) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *mockUserMappingRepo) Update(ctx context.Context, mapping *models.UserCategoryMapping) error {
	args := m.Called(ctx, mapping)
	return args.Error(0)
}

func (m *mockUserMappingRepo) Delete(ctx context.Context, id int32) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

type mockCategoryRepo struct {
	mock.Mock
}

func (m *mockCategoryRepo) GetByID(ctx context.Context, id int32) (*models.Category, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Category), args.Error(1)
}

func (m *mockCategoryRepo) Create(ctx context.Context, category *models.Category) error {
	return nil
}

func (m *mockCategoryRepo) Update(ctx context.Context, category *models.Category) error {
	return nil
}

func (m *mockCategoryRepo) Delete(ctx context.Context, id int32) error {
	return nil
}

func (m *mockCategoryRepo) GetByIDForUser(ctx context.Context, categoryID, userID int32) (*models.Category, error) {
	return nil, nil
}

func (m *mockCategoryRepo) ListByUserID(ctx context.Context, userID int32, categoryType *v1.CategoryType, opts repository.ListOptions) ([]*models.Category, int, error) {
	return nil, 0, nil
}

func (m *mockCategoryRepo) ExistsForUser(ctx context.Context, categoryID, userID int32) (bool, error) {
	return true, nil
}

func (m *mockCategoryRepo) CountByUserID(ctx context.Context, userID int32) (int, error) {
	return 0, nil
}

func (m *mockCategoryRepo) CreateDefaultCategories(ctx context.Context, userID int32) error {
	return nil
}

func (m *mockCategoryRepo) GetByNameAndType(ctx context.Context, userID int32, name string, categoryType v1.CategoryType) (*models.Category, error) {
	return nil, nil
}

func (m *mockCategoryRepo) GetByIDs(ctx context.Context, ids []int32) (map[int32]*models.Category, error) {
	return nil, nil
}

func TestNormalizeDescription(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Vietnamese with diacritics",
			input:    "Highlands Coffee Phú Mỹ Hưng",
			expected: "highlands coffee phu my hung",
		},
		{
			name:     "Multiple spaces",
			input:    "Circle  K    Store",
			expected: "circle k store",
		},
		{
			name:     "Mixed case",
			input:    "GraBBike VN",
			expected: "grabbike vn",
		},
		{
			name:     "Special characters",
			input:    "Café Cộng +  Saigon",
			expected: "cafe cong + saigon",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := normalizeDescription(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestRemoveDiacritics(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Vietnamese vowels",
			input:    "àáảãạâầấẩẫậăằắẳẵặ",
			expected: "aaaaaaaaaaaaaaaaa", // 17 'a's after removing diacritics
		},
		{
			name:     "Mixed text",
			input:    "Phở Hà Nội",
			expected: "Pho Ha Noi",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := removeDiacritics(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestMerchantMatching(t *testing.T) {
	ctx := context.Background()

	// Setup mocks
	merchantRepo := new(mockMerchantRepo)
	keywordRepo := new(mockKeywordRepo)
	userMappingRepo := new(mockUserMappingRepo)
	categoryRepo := new(mockCategoryRepo)

	// Mock merchant rules
	merchantRules := []*models.MerchantCategoryRule{
		{
			ID:              1,
			MerchantPattern: "Highlands Coffee",
			MatchType:       models.MatchTypeContains,
			CategoryID:      1,
			Confidence:      100,
			IsActive:        true,
		},
		{
			ID:              2,
			MerchantPattern: "Circle K",
			MatchType:       models.MatchTypeContains,
			CategoryID:      2,
			Confidence:      100,
			IsActive:        true,
		},
	}

	merchantRepo.On("ListActive", ctx, "VN").Return(merchantRules, nil)
	merchantRepo.On("IncrementUsageCount", ctx, mock.AnythingOfType("int32")).Return(nil).Maybe()
	keywordRepo.On("ListActive", ctx).Return([]*models.CategoryKeyword{}, nil)
	userMappingRepo.On("ListByUserID", ctx, int32(1)).Return([]*models.UserCategoryMapping{}, nil)

	categorizer := NewCategorizer(merchantRepo, keywordRepo, userMappingRepo, categoryRepo, "VN")
	err := categorizer.LoadCache(ctx)
	assert.NoError(t, err)

	tests := []struct {
		name        string
		description string
		expectMatch bool
		categoryID  int32
		confidence  int32
	}{
		{
			name:        "Highlands Coffee match",
			description: "Highlands Coffee Phú Mỹ Hưng",
			expectMatch: true,
			categoryID:  1,
			confidence:  100,
		},
		{
			name:        "Circle K match",
			description: "Circle K Store 123",
			expectMatch: true,
			categoryID:  2,
			confidence:  100,
		},
		{
			name:        "No match",
			description: "Random Store XYZ",
			expectMatch: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			suggestion, err := categorizer.SuggestCategory(ctx, 1, tt.description)
			assert.NoError(t, err)

			if tt.expectMatch {
				assert.NotNil(t, suggestion)
				assert.Equal(t, tt.categoryID, suggestion.CategoryID)
				assert.Equal(t, tt.confidence, suggestion.Confidence)
			} else {
				assert.Nil(t, suggestion)
			}
		})
	}
}

func TestKeywordMatching(t *testing.T) {
	ctx := context.Background()

	// Setup mocks
	merchantRepo := new(mockMerchantRepo)
	keywordRepo := new(mockKeywordRepo)
	userMappingRepo := new(mockUserMappingRepo)
	categoryRepo := new(mockCategoryRepo)

	// Mock keywords
	keywords := []*models.CategoryKeyword{
		{
			ID:         1,
			CategoryID: 10,
			Keyword:    "coffee",
			Language:   models.LanguageEnglish,
			Confidence: 80,
			IsActive:   true,
		},
		{
			ID:         2,
			CategoryID: 10,
			Keyword:    "cà phê",
			Language:   models.LanguageVietnamese,
			Confidence: 85,
			IsActive:   true,
		},
		{
			ID:         3,
			CategoryID: 20,
			Keyword:    "grab",
			Language:   models.LanguageEnglish,
			Confidence: 75,
			IsActive:   true,
		},
	}

	merchantRepo.On("ListActive", ctx, "VN").Return([]*models.MerchantCategoryRule{}, nil)
	merchantRepo.On("IncrementUsageCount", ctx, mock.AnythingOfType("int32")).Return(nil).Maybe()
	keywordRepo.On("ListActive", ctx).Return(keywords, nil)
	userMappingRepo.On("ListByUserID", ctx, int32(1)).Return([]*models.UserCategoryMapping{}, nil)
	userMappingRepo.On("UpdateLastUsed", mock.Anything, mock.AnythingOfType("int32")).Return(nil).Maybe()

	categorizer := NewCategorizer(merchantRepo, keywordRepo, userMappingRepo, categoryRepo, "VN")
	err := categorizer.LoadCache(ctx)
	assert.NoError(t, err)

	tests := []struct {
		name        string
		description string
		expectMatch bool
		categoryID  int32
		confidence  int32
	}{
		{
			name:        "English keyword match",
			description: "Coffee shop payment",
			expectMatch: true,
			categoryID:  10,
			confidence:  80,
		},
		{
			name:        "Vietnamese keyword match with diacritics",
			description: "Mua cà phê sáng",
			expectMatch: true,
			categoryID:  10,
			confidence:  85, // Higher confidence for Vietnamese
		},
		{
			name:        "Grab keyword match",
			description: "GrabBike ride to work",
			expectMatch: true,
			categoryID:  20,
			confidence:  75,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			suggestion, err := categorizer.SuggestCategory(ctx, 1, tt.description)
			assert.NoError(t, err)

			if tt.expectMatch {
				assert.NotNil(t, suggestion)
				assert.Equal(t, tt.categoryID, suggestion.CategoryID)
				assert.Equal(t, tt.confidence, suggestion.Confidence)
			} else {
				assert.Nil(t, suggestion)
			}
		})
	}
}

func TestUserLearning(t *testing.T) {
	ctx := context.Background()

	// Setup mocks
	merchantRepo := new(mockMerchantRepo)
	keywordRepo := new(mockKeywordRepo)
	userMappingRepo := new(mockUserMappingRepo)
	categoryRepo := new(mockCategoryRepo)

	// Mock user mappings (user's historical preferences)
	userMappings := []*models.UserCategoryMapping{
		{
			ID:                 1,
			UserID:             1,
			DescriptionPattern: "starbucks",
			CategoryID:         100,
			Confidence:         95,
			UsageCount:         10,
			LastUsedAt:         time.Now(),
		},
		{
			ID:                 2,
			UserID:             1,
			DescriptionPattern: "the coffee house",
			CategoryID:         100,
			Confidence:         95,
			UsageCount:         5,
			LastUsedAt:         time.Now(),
		},
	}

	merchantRepo.On("ListActive", ctx, "VN").Return([]*models.MerchantCategoryRule{}, nil)
	merchantRepo.On("IncrementUsageCount", ctx, mock.AnythingOfType("int32")).Return(nil).Maybe()
	keywordRepo.On("ListActive", ctx).Return([]*models.CategoryKeyword{}, nil)
	userMappingRepo.On("ListByUserID", ctx, int32(1)).Return(userMappings, nil)
	userMappingRepo.On("UpdateLastUsed", mock.Anything, mock.AnythingOfType("int32")).Return(nil).Maybe()

	categorizer := NewCategorizer(merchantRepo, keywordRepo, userMappingRepo, categoryRepo, "VN")

	tests := []struct {
		name        string
		description string
		expectMatch bool
		categoryID  int32
		confidence  int32
	}{
		{
			name:        "User preference match - Starbucks",
			description: "Starbucks Vietnam",
			expectMatch: true,
			categoryID:  100,
			confidence:  95,
		},
		{
			name:        "User preference match - The Coffee House",
			description: "The Coffee House District 1",
			expectMatch: true,
			categoryID:  100,
			confidence:  95,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			suggestion, err := categorizer.SuggestCategory(ctx, 1, tt.description)
			assert.NoError(t, err)

			if tt.expectMatch {
				assert.NotNil(t, suggestion)
				assert.Equal(t, tt.categoryID, suggestion.CategoryID)
				assert.Equal(t, tt.confidence, suggestion.Confidence)
				assert.Contains(t, suggestion.Reason, "User history")
			} else {
				assert.Nil(t, suggestion)
			}
		})
	}
}

func TestLearnFromCorrection(t *testing.T) {
	ctx := context.Background()

	// Setup mocks
	merchantRepo := new(mockMerchantRepo)
	keywordRepo := new(mockKeywordRepo)
	userMappingRepo := new(mockUserMappingRepo)
	categoryRepo := new(mockCategoryRepo)

	categorizer := NewCategorizer(merchantRepo, keywordRepo, userMappingRepo, categoryRepo, "VN")

	tests := []struct {
		name        string
		userID      int32
		description string
		categoryID  int32
	}{
		{
			name:        "Learn new pattern",
			userID:      1,
			description: "New Coffee Shop",
			categoryID:  50,
		},
		{
			name:        "Learn with Vietnamese",
			userID:      1,
			description: "Quán Cà Phê Mới",
			categoryID:  50,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Mock GetByUserIDAndPattern to return not found (new pattern)
			userMappingRepo.On("GetByUserIDAndPattern", ctx, tt.userID, mock.Anything).
				Return(nil, assert.AnError).Once()

			// Mock CreateOrUpdate
			userMappingRepo.On("CreateOrUpdate", ctx, mock.MatchedBy(func(m *models.UserCategoryMapping) bool {
				return m.UserID == tt.userID &&
					m.CategoryID == tt.categoryID &&
					m.Confidence == 95 &&
					m.UsageCount == 1
			})).Return(nil).Once()

			err := categorizer.LearnFromCorrection(ctx, tt.userID, tt.description, tt.categoryID)
			assert.NoError(t, err)
		})
	}
}
