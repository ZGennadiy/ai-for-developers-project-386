package booking

import (
	"errors"
	"net/http"
)

var (
	ErrEventTypeNotFound   = errors.New("event type not found")
	ErrEventTypeExists     = errors.New("event type already exists")
	ErrBookingNotFound     = errors.New("booking not found")
	ErrSlotTaken           = errors.New("slot already taken")
	ErrInvalidEventType    = errors.New("invalid event type fields")
	ErrInvalidBookingInput = errors.New("invalid guest fields")
	ErrSlotOutOfWindow     = errors.New("start is in the past or beyond the 14-day window")
	ErrInvalidSlot         = errors.New("start does not match an available slot")
)

// Lookup maps a domain error to the contract's HTTP status and
// machine-readable error code. Returns ok=false if err is not one of the
// known domain errors.
func Lookup(err error) (status int, code string, ok bool) {
	switch {
	case errors.Is(err, ErrEventTypeNotFound):
		return http.StatusNotFound, "event_type_not_found", true
	case errors.Is(err, ErrBookingNotFound):
		return http.StatusNotFound, "booking_not_found", true
	case errors.Is(err, ErrEventTypeExists):
		return http.StatusConflict, "event_type_exists", true
	case errors.Is(err, ErrSlotTaken):
		return http.StatusConflict, "slot_taken", true
	case errors.Is(err, ErrInvalidEventType):
		return http.StatusUnprocessableEntity, "invalid_event_type", true
	case errors.Is(err, ErrInvalidBookingInput):
		return http.StatusUnprocessableEntity, "invalid_booking_request", true
	case errors.Is(err, ErrSlotOutOfWindow):
		return http.StatusUnprocessableEntity, "slot_out_of_window", true
	case errors.Is(err, ErrInvalidSlot):
		return http.StatusUnprocessableEntity, "invalid_slot", true
	default:
		return 0, "", false
	}
}
