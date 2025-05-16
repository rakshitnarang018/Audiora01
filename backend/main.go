package main

import (
	"backend/routes"
	"log"
	"net/http"
)

// Simple CORS middleware
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow all origins - for dev, change this in production
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	router := routes.SetupRouter()

	// Wrap router with CORS middleware
	handler := corsMiddleware(router)

	log.Println("Server listening on port 8000...")
	if err := http.ListenAndServe(":8000", handler); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
