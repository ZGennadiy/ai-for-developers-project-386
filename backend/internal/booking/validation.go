package booking

import (
	"fmt"
	"net/mail"
	"strings"
)

func validateEventType(req CreateEventTypeRequest) error {
	if strings.TrimSpace(req.ID) == "" {
		return fmt.Errorf("%w: id must not be empty", ErrInvalidEventType)
	}
	if strings.TrimSpace(req.Name) == "" {
		return fmt.Errorf("%w: name must not be empty", ErrInvalidEventType)
	}
	if req.DurationMinutes < 1 {
		return fmt.Errorf("%w: durationMinutes must be at least 1", ErrInvalidEventType)
	}
	return nil
}

func validateBookingInput(req CreateBookingRequest) error {
	if strings.TrimSpace(req.EventTypeID) == "" {
		return fmt.Errorf("%w: eventTypeId must not be empty", ErrInvalidBookingInput)
	}
	if strings.TrimSpace(req.GuestName) == "" {
		return fmt.Errorf("%w: guestName must not be empty", ErrInvalidBookingInput)
	}
	if _, err := mail.ParseAddress(req.GuestEmail); err != nil {
		return fmt.Errorf("%w: guestEmail must be a valid email address", ErrInvalidBookingInput)
	}
	if req.Start.IsZero() {
		return fmt.Errorf("%w: start must be a valid ISO 8601 datetime", ErrInvalidBookingInput)
	}
	return nil
}
