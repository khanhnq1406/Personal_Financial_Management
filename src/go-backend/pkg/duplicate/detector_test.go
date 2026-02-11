// Package duplicate provides tests for duplicate detection functionality
package duplicate

import (
	"testing"
)

func TestCalculateStringSimilarity(t *testing.T) {
	tests := []struct {
		s1       string
		s2       string
		expected float64
		minScore float64
	}{
		{"Payment to Starbucks #123", "Payment to Starbucks #123", 1.0, 0.99},
		{"Starbucks Downtown", "Starbucks downtown", 1.0, 0.99},
		{"Grab ride - Airport", "Grab ride - Airpot", 0.9, 0.85},
		{"Amazon purchase", "Netflix subscription", 0.3, 0.0},
		{"", "", 0.0, 0.0},
	}

	for _, tt := range tests {
		result := CalculateStringSimilarity(tt.s1, tt.s2)
		if result < tt.minScore {
			t.Errorf("CalculateStringSimilarity(%q, %q) = %.2f, expected >= %.2f", tt.s1, tt.s2, result, tt.minScore)
		}
	}
}

func TestLevenshteinDistance(t *testing.T) {
	tests := []struct {
		s1      string
		s2      string
		maxDist int
	}{
		{"kitten", "sitting", 3},
		{"Saturday", "Sunday", 3},
		{"hello", "hello", 0},
		{"abc", "xyz", 3},
	}

	for _, tt := range tests {
		result := LevenshteinDistance(tt.s1, tt.s2)
		if result > tt.maxDist {
			t.Errorf("LevenshteinDistance(%q, %q) = %d, expected <= %d", tt.s1, tt.s2, result, tt.maxDist)
		}
	}
}

func TestNormalizeString(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Hello World!", "hello world"},
		{"PAYMENT-TO-STARBUCKS", "payment to starbucks"},
		{"Multiple   Spaces", "multiple spaces"},
		{"Special@#$Characters", "special characters"},
		{"123ABC456", "123abc456"},
		{"", ""},
	}

	for _, tt := range tests {
		result := normalizeString(tt.input)
		if result != tt.expected {
			t.Errorf("normalizeString(%q) = %q, expected %q", tt.input, result, tt.expected)
		}
	}
}
