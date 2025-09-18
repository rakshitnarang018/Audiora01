package main

import (
	"backend/routes"
	"log"
	"net/http"
	"os"
)

// corsMiddleware allows cross-origin requests, which is essential for your
// Vercel frontend to communicate with your Render backend.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// In a real production environment, you might restrict this to your actual frontend URL.
		// For now, "*" is fine.
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight (OPTIONS) requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	router := routes.SetupRouter()

	// Wrap the router with our CORS middleware
	handler := corsMiddleware(router)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000" // Default port if not specified
	}

	log.Printf("Server listening on port %s...", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
