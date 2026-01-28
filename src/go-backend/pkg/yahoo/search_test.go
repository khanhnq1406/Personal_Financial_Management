package yahoo

import (
	"context"
	"testing"
)

func TestSearchSymbols_BasicSearch(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}
	ctx := context.Background()
	results, err := SearchSymbols(ctx, "AAPL", 10)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if len(results) == 0 {
		t.Error("expected at least one result")
	}
	found := false
	for _, r := range results {
		if r.Symbol == "AAPL" {
			found = true
			if r.Name == "" {
				t.Error("expected name to be set")
			}
		}
	}
	if !found {
		t.Error("expected to find AAPL in results")
	}
}

func TestSearchSymbols_EmptyQuery(t *testing.T) {
	ctx := context.Background()
	_, err := SearchSymbols(ctx, "", 10)
	if err == nil {
		t.Error("expected error for empty query")
	}
}

func TestSearchSymbols_VietnameseStock(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}
	ctx := context.Background()
	results, err := SearchSymbols(ctx, "VCB", 10)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if len(results) == 0 {
		t.Error("expected at least one result for VCB")
	}
}
