package categorization

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"unicode"

	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"

	"wealthjourney/domain/models"
	"wealthjourney/domain/repository"
)

// CategorySuggestion represents a suggested category with confidence score and reason
type CategorySuggestion struct {
	CategoryID int32
	Confidence int32  // 0-100
	Reason     string // Why this category was suggested
}

// Categorizer provides transaction categorization based on merchant rules, user learning, and keywords
type Categorizer struct {
	merchantRepo     repository.MerchantRuleRepository
	keywordRepo      repository.KeywordRepository
	userMappingRepo  repository.UserMappingRepository
	categoryRepo     repository.CategoryRepository
	region           string
	merchantCache    []*models.MerchantCategoryRule
	keywordCache     []*models.CategoryKeyword
}

// NewCategorizer creates a new Categorizer instance
func NewCategorizer(
	merchantRepo repository.MerchantRuleRepository,
	keywordRepo repository.KeywordRepository,
	userMappingRepo repository.UserMappingRepository,
	categoryRepo repository.CategoryRepository,
	region string,
) *Categorizer {
	return &Categorizer{
		merchantRepo:    merchantRepo,
		keywordRepo:     keywordRepo,
		userMappingRepo: userMappingRepo,
		categoryRepo:    categoryRepo,
		region:          region,
	}
}

// LoadCache loads merchant rules and keywords into memory for faster matching
func (c *Categorizer) LoadCache(ctx context.Context) error {
	// Load active merchant rules
	rules, err := c.merchantRepo.ListActive(ctx, c.region)
	if err != nil {
		return fmt.Errorf("failed to load merchant rules: %w", err)
	}
	c.merchantCache = rules

	// Load active keywords
	keywords, err := c.keywordRepo.ListActive(ctx)
	if err != nil {
		return fmt.Errorf("failed to load keywords: %w", err)
	}
	c.keywordCache = keywords

	return nil
}

// SuggestCategory suggests a category for a transaction description using a 3-strategy approach
func (c *Categorizer) SuggestCategory(ctx context.Context, userID int32, description string) (*CategorySuggestion, error) {
	// Normalize description for matching
	normalizedDesc := normalizeDescription(description)

	// Strategy 1: User learning (highest priority - confidence 95%)
	if suggestion := c.matchUserLearning(ctx, userID, normalizedDesc); suggestion != nil {
		return suggestion, nil
	}

	// Strategy 2: Merchant database (confidence 100%)
	if suggestion := c.matchMerchant(ctx, normalizedDesc); suggestion != nil {
		return suggestion, nil
	}

	// Strategy 3: Keyword matching (confidence 70-85%)
	if suggestion := c.matchKeywords(ctx, normalizedDesc); suggestion != nil {
		return suggestion, nil
	}

	// No match found
	return nil, nil
}

// matchUserLearning matches against user's historical category preferences
func (c *Categorizer) matchUserLearning(ctx context.Context, userID int32, normalizedDesc string) *CategorySuggestion {
	// Get user's learned mappings
	mappings, err := c.userMappingRepo.ListByUserID(ctx, userID)
	if err != nil {
		return nil
	}

	// Try to match against user's patterns (sorted by usage count)
	for _, mapping := range mappings {
		normalizedPattern := normalizeDescription(mapping.DescriptionPattern)
		if strings.Contains(normalizedDesc, normalizedPattern) {
			// Update usage stats asynchronously (fire and forget)
			go func(mappingID int32) {
				_ = c.userMappingRepo.UpdateLastUsed(context.Background(), mappingID)
			}(mapping.ID)

			return &CategorySuggestion{
				CategoryID: mapping.CategoryID,
				Confidence: mapping.Confidence,
				Reason:     "User history",
			}
		}
	}

	return nil
}

// matchMerchant matches against merchant database rules
func (c *Categorizer) matchMerchant(ctx context.Context, normalizedDesc string) *CategorySuggestion {
	// Use cached rules if available, otherwise load from database
	rules := c.merchantCache
	if rules == nil {
		var err error
		rules, err = c.merchantRepo.ListActive(ctx, c.region)
		if err != nil {
			return nil
		}
	}

	// Try to match against merchant patterns (sorted by confidence and usage)
	for _, rule := range rules {
		normalizedPattern := normalizeDescription(rule.MerchantPattern)
		matched := false

		switch rule.MatchType {
		case models.MatchTypeExact:
			matched = normalizedDesc == normalizedPattern
		case models.MatchTypePrefix:
			matched = strings.HasPrefix(normalizedDesc, normalizedPattern)
		case models.MatchTypeContains:
			matched = strings.Contains(normalizedDesc, normalizedPattern)
		case models.MatchTypeSuffix:
			matched = strings.HasSuffix(normalizedDesc, normalizedPattern)
		case models.MatchTypeRegex:
			if re, err := regexp.Compile(rule.MerchantPattern); err == nil {
				matched = re.MatchString(normalizedDesc)
			}
		}

		if matched {
			// Update usage stats asynchronously (fire and forget)
			go func(ruleID int32) {
				_ = c.merchantRepo.IncrementUsageCount(context.Background(), ruleID)
			}(rule.ID)

			return &CategorySuggestion{
				CategoryID: rule.CategoryID,
				Confidence: rule.Confidence,
				Reason:     fmt.Sprintf("Merchant: %s", rule.MerchantPattern),
			}
		}
	}

	return nil
}

// matchKeywords matches against category keywords
func (c *Categorizer) matchKeywords(ctx context.Context, normalizedDesc string) *CategorySuggestion {
	// Use cached keywords if available, otherwise load from database
	keywords := c.keywordCache
	if keywords == nil {
		var err error
		keywords, err = c.keywordRepo.ListActive(ctx)
		if err != nil {
			return nil
		}
	}

	// Track best match (highest confidence)
	var bestMatch *CategorySuggestion

	// Try to match against keywords (sorted by confidence)
	for _, keyword := range keywords {
		normalizedKeyword := normalizeDescription(keyword.Keyword)
		if strings.Contains(normalizedDesc, normalizedKeyword) {
			if bestMatch == nil || keyword.Confidence > bestMatch.Confidence {
				bestMatch = &CategorySuggestion{
					CategoryID: keyword.CategoryID,
					Confidence: keyword.Confidence,
					Reason:     fmt.Sprintf("Keyword: %s", keyword.Keyword),
				}
			}
		}
	}

	return bestMatch
}

// LearnFromCorrection learns from user's category correction
func (c *Categorizer) LearnFromCorrection(ctx context.Context, userID int32, description string, categoryID int32) error {
	// Normalize description for pattern matching
	normalizedDesc := normalizeDescription(description)

	// Create or update user mapping with confidence 95%
	mapping := &models.UserCategoryMapping{
		UserID:             userID,
		DescriptionPattern: normalizedDesc,
		CategoryID:         categoryID,
		Confidence:         95,
		UsageCount:         1,
	}

	// Check if mapping already exists
	existing, err := c.userMappingRepo.GetByUserIDAndPattern(ctx, userID, normalizedDesc)
	if err == nil && existing != nil {
		// Update existing mapping
		mapping.ID = existing.ID
		mapping.UsageCount = existing.UsageCount + 1
	}

	// Create or update the mapping
	return c.userMappingRepo.CreateOrUpdate(ctx, mapping)
}

// normalizeDescription normalizes a description for matching by:
// 1. Converting to lowercase
// 2. Removing Vietnamese diacritics
// 3. Removing extra whitespace
// 4. Trimming
func normalizeDescription(s string) string {
	// Convert to lowercase
	s = strings.ToLower(s)

	// Remove Vietnamese diacritics
	s = removeDiacritics(s)

	// Remove extra whitespace
	s = strings.Join(strings.Fields(s), " ")

	// Trim
	s = strings.TrimSpace(s)

	return s
}

// removeDiacritics removes diacritical marks from Vietnamese text
// Example: "Café Phố" -> "cafe pho"
func removeDiacritics(s string) string {
	// Use unicode normalization to decompose characters
	t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
	result, _, _ := transform.String(t, s)
	return result
}
