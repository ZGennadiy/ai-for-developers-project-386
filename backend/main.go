package main

import (
	"cmp"
	"log"
	"net/http"
	"os"

	"backend/internal/booking"
	"backend/internal/httpapi"
)

func main() {
	port := cmp.Or(os.Getenv("PORT"), "3000")
	corsOrigin := cmp.Or(os.Getenv("FRONTEND_ORIGIN"), "http://localhost:5173")
	staticDir := os.Getenv("STATIC_DIR")

	store := booking.NewStore()
	router := httpapi.NewRouter(store, corsOrigin, staticDir)

	addr := ":" + port
	log.Printf("Booking Calendar API listening on %s (CORS origin: %s, static dir: %q)", addr, corsOrigin, staticDir)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatal(err)
	}
}
