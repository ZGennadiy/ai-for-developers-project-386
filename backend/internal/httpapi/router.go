package httpapi

import (
	"net/http"

	"backend/internal/booking"
)

// NewRouter wires the contract's 8 endpoints to their handlers and applies
// CORS (for corsOrigin) and panic recovery.
func NewRouter(store *booking.Store, corsOrigin string) http.Handler {
	h := NewHandler(store)
	mux := http.NewServeMux()

	mux.HandleFunc("GET /owner", h.GetOwner)

	mux.HandleFunc("POST /event-types", h.CreateEventType)
	mux.HandleFunc("GET /event-types", h.ListEventTypes)
	mux.HandleFunc("GET /event-types/{eventTypeId}", h.GetEventType)
	mux.HandleFunc("GET /event-types/{eventTypeId}/slots", h.ListAvailableSlots)

	mux.HandleFunc("POST /bookings", h.CreateBooking)
	mux.HandleFunc("GET /bookings", h.ListBookings)
	mux.HandleFunc("GET /bookings/{bookingId}", h.GetBooking)

	return withRecover(withCORS(corsOrigin, mux))
}
