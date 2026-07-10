package booking

import "time"

// Owner is the single, pre-seeded calendar owner profile.
type Owner struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	TimeZone string `json:"timeZone"`
}

// EventType is a meeting template created by the owner.
type EventType struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Description     string `json:"description"`
	DurationMinutes int    `json:"durationMinutes"`
}

// Slot is a free interval a guest can book.
type Slot struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

// Booking is a guest's reservation of a slot for a given event type.
type Booking struct {
	ID            string    `json:"id"`
	EventTypeID   string    `json:"eventTypeId"`
	EventTypeName string    `json:"eventTypeName"`
	Start         time.Time `json:"start"`
	End           time.Time `json:"end"`
	GuestName     string    `json:"guestName"`
	GuestEmail    string    `json:"guestEmail"`
	Note          string    `json:"note,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
}

// CreateEventTypeRequest is the request body for POST /event-types.
type CreateEventTypeRequest struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Description     string `json:"description"`
	DurationMinutes int    `json:"durationMinutes"`
}

// CreateBookingRequest is the request body for POST /bookings.
type CreateBookingRequest struct {
	EventTypeID string    `json:"eventTypeId"`
	Start       time.Time `json:"start"`
	GuestName   string    `json:"guestName"`
	GuestEmail  string    `json:"guestEmail"`
	Note        string    `json:"note,omitempty"`
}

// ApiError is the contract's unified error body shape.
type ApiError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
