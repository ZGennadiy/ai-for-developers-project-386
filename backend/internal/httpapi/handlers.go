package httpapi

import (
	"encoding/json"
	"net/http"
	"time"

	"backend/internal/booking"
)

type Handler struct {
	store *booking.Store
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, booking.ApiError{Code: code, Message: message})
}

// writeDomainError maps a domain error (from the booking package) to the
// contract's HTTP status + ApiError body. Falls back to 500 for anything
// unrecognized (e.g. a bug elsewhere), since the contract has no slot for it.
func writeDomainError(w http.ResponseWriter, err error) {
	status, code, ok := booking.Lookup(err)
	if !ok {
		writeError(w, http.StatusInternalServerError, "internal_error", err.Error())
		return
	}
	writeError(w, status, code, err.Error())
}

func (h *Handler) GetOwner(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, h.store.GetOwner())
}

func (h *Handler) CreateEventType(w http.ResponseWriter, r *http.Request) {
	var req booking.CreateEventTypeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "invalid_event_type", "malformed request body")
		return
	}

	et, err := h.store.CreateEventType(req)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, et)
}

func (h *Handler) ListEventTypes(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, h.store.ListEventTypes())
}

func (h *Handler) GetEventType(w http.ResponseWriter, r *http.Request) {
	et, err := h.store.GetEventType(r.PathValue("eventTypeId"))
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, et)
}

func (h *Handler) ListAvailableSlots(w http.ResponseWriter, r *http.Request) {
	slots, err := h.store.AvailableSlots(r.PathValue("eventTypeId"), time.Now().UTC())
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, slots)
}

func (h *Handler) CreateBooking(w http.ResponseWriter, r *http.Request) {
	var req booking.CreateBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "invalid_booking_request", "malformed request body")
		return
	}

	created, err := h.store.CreateBooking(req, time.Now().UTC())
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

func (h *Handler) ListBookings(w http.ResponseWriter, r *http.Request) {
	from := time.Now().UTC()
	if raw := r.URL.Query().Get("from"); raw != "" {
		if parsed, err := time.Parse(time.RFC3339, raw); err == nil {
			from = parsed.UTC()
		}
	}
	writeJSON(w, http.StatusOK, h.store.ListBookings(from))
}

func (h *Handler) GetBooking(w http.ResponseWriter, r *http.Request) {
	b, err := h.store.GetBooking(r.PathValue("bookingId"))
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, b)
}
