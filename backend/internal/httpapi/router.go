package httpapi

import (
	"net/http"

	"backend/internal/booking"
)

// newAPIMux wires the contract's 8 endpoints to their handlers, unprefixed,
// exactly matching the TypeSpec contract's documented paths.
func newAPIMux(store *booking.Store) *http.ServeMux {
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

	return mux
}

// NewRouter mounts the API under /api/ (stripping the prefix so handlers see
// their original unprefixed paths) so it can share an origin with the
// bundled frontend SPA without colliding with client-side routes like
// /owner or /bookings/{id}. When staticDir is non-empty, it also serves the
// SPA's static build at "/" with an index.html fallback. Panic recovery
// wraps everything.
func NewRouter(store *booking.Store, corsOrigin, staticDir string) http.Handler {
	mux := http.NewServeMux()
	mux.Handle("/api/", http.StripPrefix("/api", withCORS(corsOrigin, newAPIMux(store))))

	if staticDir != "" {
		mux.Handle("/", newSPAHandler(staticDir))
	}

	return withRecover(mux)
}
