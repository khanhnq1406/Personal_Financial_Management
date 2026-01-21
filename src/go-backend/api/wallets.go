package handler

import (
	"encoding/json"
	"net/http"
)

func Wallets(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"endpoint": "wallets",
		"path":     r.URL.Path,
	})
}
