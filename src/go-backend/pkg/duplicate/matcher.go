// Package duplicate provides string matching utilities for duplicate detection
package duplicate

import (
	"strings"
	"unicode"

	"github.com/agnivade/levenshtein"
)

// CalculateStringSimilarity returns similarity score between 0 and 1
func CalculateStringSimilarity(s1, s2 string) float64 {
	// Normalize strings
	n1 := normalizeString(s1)
	n2 := normalizeString(s2)

	if n1 == n2 {
		return 1.0
	}

	if len(n1) == 0 || len(n2) == 0 {
		return 0.0
	}

	// Calculate Levenshtein distance
	distance := levenshtein.ComputeDistance(n1, n2)
	maxLen := max(len(n1), len(n2))

	// Convert distance to similarity (0 = identical, 1 = completely different)
	similarity := 1.0 - (float64(distance) / float64(maxLen))

	return similarity
}

// LevenshteinDistance calculates edit distance between two strings
func LevenshteinDistance(s1, s2 string) int {
	return levenshtein.ComputeDistance(normalizeString(s1), normalizeString(s2))
}

func normalizeString(s string) string {
	// Convert to lowercase
	s = strings.ToLower(s)

	// Remove special characters and extra spaces
	var result []rune
	var lastWasSpace bool

	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			result = append(result, r)
			lastWasSpace = false
		} else if !lastWasSpace {
			result = append(result, ' ')
			lastWasSpace = true
		}
	}

	return strings.TrimSpace(string(result))
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
