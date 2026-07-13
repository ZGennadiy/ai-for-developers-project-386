package main

import (
	"log"
	"net/http"
	"os"

	"backend/internal/booking"
	"backend/internal/httpapi"
)

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	port := getenv("PORT", "3000")
	corsOrigin := getenv("FRONTEND_ORIGIN", "http://localhost:5173")
	staticDir := getenv("STATIC_DIR", "")

	store := booking.NewStore()
	router := httpapi.NewRouter(store, corsOrigin, staticDir)

	addr := ":" + port
	log.Printf("Booking Calendar API listening on %s (CORS origin: %s, static dir: %q)", addr, corsOrigin, staticDir)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatal(err)
	}
}
