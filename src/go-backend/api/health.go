package handler

import (
	"encoding/json"
	"net/http"
)

func Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "ok",
		"service": "wealthjourney-api",
		"version": "2.0.0",
		"path":    r.URL.Path,
	})
}
