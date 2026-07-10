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

// Code maps a domain error to the contract's machine-readable error code.
// Returns ("", false) if err is not one of the known domain errors.
func Code(err error) (string, bool) {
	switch {
	case errors.Is(err, ErrEventTypeNotFound):
		return "event_type_not_found", true
	case errors.Is(err, ErrEventTypeExists):
		return "event_type_exists", true
	case errors.Is(err, ErrBookingNotFound):
		return "booking_not_found", true
	case errors.Is(err, ErrSlotTaken):
		return "slot_taken", true
	case errors.Is(err, ErrInvalidEventType):
		return "invalid_event_type", true
	case errors.Is(err, ErrInvalidBookingInput):
		return "invalid_booking_request", true
	case errors.Is(err, ErrSlotOutOfWindow):
		return "slot_out_of_window", true
	case errors.Is(err, ErrInvalidSlot):
		return "invalid_slot", true
	default:
		return "", false
	}
}

// HTTPStatus maps a domain error to the contract's HTTP status code.
// Returns (0, false) if err is not one of the known domain errors.
func HTTPStatus(err error) (int, bool) {
	switch {
	case errors.Is(err, ErrEventTypeNotFound), errors.Is(err, ErrBookingNotFound):
		return http.StatusNotFound, true
	case errors.Is(err, ErrEventTypeExists), errors.Is(err, ErrSlotTaken):
		return http.StatusConflict, true
	case errors.Is(err, ErrInvalidEventType), errors.Is(err, ErrInvalidBookingInput),
		errors.Is(err, ErrSlotOutOfWindow), errors.Is(err, ErrInvalidSlot):
		return http.StatusUnprocessableEntity, true
	default:
		return 0, false
	}
}
