package main

import (
	"log"
	"net/http"

	"backend/routes"
)

func main() {
	router := routes.SetupRouter()

	log.Println("Server started at :8000")
	err := http.ListenAndServe(":8000", router)
	if err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
