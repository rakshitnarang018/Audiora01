package routes

import (
	"backend/handlers"

	"github.com/gorilla/mux"
)

func SetupRouter() *mux.Router {
	router := mux.NewRouter()
	router.HandleFunc("/ping", handlers.PingHandler).Methods("GET")
	router.HandleFunc("/upload-audio", handlers.UploadAudioHandler).Methods("POST")
	return router
}
