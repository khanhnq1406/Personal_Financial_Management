package parser

import (
	"strings"
)

// CategorySuggestion represents a suggested category with confidence score
type CategorySuggestion struct {
	CategoryID int32
	Confidence int32 // 0-100
	Reason     string
}

// Common keywords for category detection
var categoryKeywords = map[string][]string{
	// Food & Dining
	"food": {
		"restaurant", "cafe", "coffee", "food", "dining", "lunch", "dinner",
		"breakfast", "pizza", "burger", "delivery", "grab food", "shopeefood",
		"nhà hàng", "quán ăn", "cà phê", "đồ ăn",
	},
	// Transportation
	"transportation": {
		"uber", "grab", "taxi", "bus", "train", "parking", "fuel", "gas",
		"toll", "vehicle", "car", "bike", "motorcycle", "xe", "xăng", "bãi đỗ",
	},
	// Shopping
	"shopping": {
		"shop", "store", "mall", "market", "purchase", "buy", "amazon",
		"lazada", "shopee", "tiki", "mua sắm", "chợ", "siêu thị",
	},
	// Entertainment
	"entertainment": {
		"movie", "cinema", "game", "netflix", "spotify", "youtube",
		"entertainment", "fun", "hobby", "giải trí", "phim",
	},
	// Bills & Utilities
	"utilities": {
		"electric", "water", "internet", "phone", "utility", "bill",
		"electricity", "gas", "wifi", "tiền điện", "tiền nước", "cước",
	},
	// Healthcare
	"healthcare": {
		"hospital", "doctor", "pharmacy", "medicine", "clinic", "health",
		"medical", "dental", "bệnh viện", "thuốc", "khám bệnh",
	},
	// Education
	"education": {
		"school", "university", "course", "tuition", "book", "education",
		"training", "học", "trường", "khóa học",
	},
	// Salary & Income
	"income": {
		"salary", "wage", "income", "bonus", "commission", "refund",
		"lương", "thu nhập", "thưởng",
	},
}

// SuggestCategory analyzes transaction description and suggests a category
func SuggestCategory(description string, transactionType int32) CategorySuggestion {
	descLower := strings.ToLower(description)

	// For income transactions
	if transactionType == 1 { // INCOME type
		if containsAnyKeyword(descLower, categoryKeywords["income"]) {
			return CategorySuggestion{
				CategoryID: 0, // Will need to map to actual category IDs
				Confidence: 70,
				Reason:     "Income keywords detected in description",
			}
		}
		return CategorySuggestion{
			CategoryID: 0,
			Confidence: 30,
			Reason:     "Generic income transaction",
		}
	}

	// For expense transactions - check each category
	bestMatch := CategorySuggestion{
		CategoryID: 0,
		Confidence: 0,
		Reason:     "No category match found",
	}

	// Check food category
	if containsAnyKeyword(descLower, categoryKeywords["food"]) {
		return CategorySuggestion{
			CategoryID: 0, // Will need to map to actual category IDs
			Confidence: 80,
			Reason:     "Food/dining keywords detected",
		}
	}

	// Check transportation
	if containsAnyKeyword(descLower, categoryKeywords["transportation"]) {
		return CategorySuggestion{
			CategoryID: 0,
			Confidence: 75,
			Reason:     "Transportation keywords detected",
		}
	}

	// Check shopping
	if containsAnyKeyword(descLower, categoryKeywords["shopping"]) {
		return CategorySuggestion{
			CategoryID: 0,
			Confidence: 70,
			Reason:     "Shopping keywords detected",
		}
	}

	// Check entertainment
	if containsAnyKeyword(descLower, categoryKeywords["entertainment"]) {
		return CategorySuggestion{
			CategoryID: 0,
			Confidence: 75,
			Reason:     "Entertainment keywords detected",
		}
	}

	// Check utilities/bills
	if containsAnyKeyword(descLower, categoryKeywords["utilities"]) {
		return CategorySuggestion{
			CategoryID: 0,
			Confidence: 85,
			Reason:     "Utility/bill keywords detected",
		}
	}

	// Check healthcare
	if containsAnyKeyword(descLower, categoryKeywords["healthcare"]) {
		return CategorySuggestion{
			CategoryID: 0,
			Confidence: 80,
			Reason:     "Healthcare keywords detected",
		}
	}

	// Check education
	if containsAnyKeyword(descLower, categoryKeywords["education"]) {
		return CategorySuggestion{
			CategoryID: 0,
			Confidence: 75,
			Reason:     "Education keywords detected",
		}
	}

	return bestMatch
}

// containsAnyKeyword checks if the text contains any of the keywords
func containsAnyKeyword(text string, keywords []string) bool {
	for _, keyword := range keywords {
		if strings.Contains(text, keyword) {
			return true
		}
	}
	return false
}

// LevenshteinDistance calculates the edit distance between two strings
// This can be used for fuzzy matching in the future
func LevenshteinDistance(s1, s2 string) int {
	len1 := len(s1)
	len2 := len(s2)

	// Create a matrix to store distances
	matrix := make([][]int, len1+1)
	for i := range matrix {
		matrix[i] = make([]int, len2+1)
	}

	// Initialize first row and column
	for i := 0; i <= len1; i++ {
		matrix[i][0] = i
	}
	for j := 0; j <= len2; j++ {
		matrix[0][j] = j
	}

	// Calculate distances
	for i := 1; i <= len1; i++ {
		for j := 1; j <= len2; j++ {
			cost := 0
			if s1[i-1] != s2[j-1] {
				cost = 1
			}

			matrix[i][j] = min(
				matrix[i-1][j]+1,      // deletion
				matrix[i][j-1]+1,      // insertion
				matrix[i-1][j-1]+cost, // substitution
			)
		}
	}

	return matrix[len1][len2]
}

func min(a, b, c int) int {
	if a <= b && a <= c {
		return a
	}
	if b <= c {
		return b
	}
	return c
}
