package booking

import (
	"fmt"
	"sort"
	"sync"
	"time"
)

// Store is a thread-safe in-memory holder of all booking-calendar data.
// Data does not persist across process restarts.
type Store struct {
	mu sync.RWMutex

	owner      Owner
	eventTypes map[string]EventType
	bookings   []Booking

	nextBookingID int64
}

func NewStore() *Store {
	return &Store{
		owner: Owner{
			ID:       "owner-1",
			Name:     "Alex Ivanov",
			Email:    "owner@example.com",
			TimeZone: "Europe/Moscow",
		},
		eventTypes: make(map[string]EventType),
	}
}

func (s *Store) GetOwner() Owner {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.owner
}

func (s *Store) CreateEventType(req CreateEventTypeRequest) (EventType, error) {
	if err := validateEventType(req); err != nil {
		return EventType{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.eventTypes[req.ID]; exists {
		return EventType{}, fmt.Errorf("%w: id %q", ErrEventTypeExists, req.ID)
	}

	et := EventType{
		ID:              req.ID,
		Name:            req.Name,
		Description:     req.Description,
		DurationMinutes: req.DurationMinutes,
	}
	s.eventTypes[req.ID] = et
	return et, nil
}

func (s *Store) ListEventTypes() []EventType {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]EventType, 0, len(s.eventTypes))
	for _, et := range s.eventTypes {
		result = append(result, et)
	}
	sort.Slice(result, func(i, j int) bool { return result[i].ID < result[j].ID })
	return result
}

func (s *Store) GetEventType(id string) (EventType, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	et, ok := s.eventTypes[id]
	if !ok {
		return EventType{}, fmt.Errorf("%w: id %q", ErrEventTypeNotFound, id)
	}
	return et, nil
}

// AvailableSlots returns the free business-hours slots for eventTypeID over
// the next 14 days from now, excluding any time already covered by an
// existing booking (for any event type).
func (s *Store) AvailableSlots(eventTypeID string, now time.Time) ([]Slot, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	et, ok := s.eventTypes[eventTypeID]
	if !ok {
		return nil, fmt.Errorf("%w: id %q", ErrEventTypeNotFound, eventTypeID)
	}

	candidates := generateSlots(et, s.owner, now)
	free := make([]Slot, 0, len(candidates))
	for _, slot := range candidates {
		if !s.hasOverlapLocked(slot.Start, slot.End) {
			free = append(free, slot)
		}
	}
	return free, nil
}

func (s *Store) hasOverlapLocked(start, end time.Time) bool {
	for _, b := range s.bookings {
		if start.Before(b.End) && b.Start.Before(end) {
			return true
		}
	}
	return false
}

// CreateBooking validates the request against business rules and, if the
// requested slot is free, atomically records the booking.
func (s *Store) CreateBooking(req CreateBookingRequest, now time.Time) (Booking, error) {
	if err := validateBookingInput(req); err != nil {
		return Booking{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	et, ok := s.eventTypes[req.EventTypeID]
	if !ok {
		return Booking{}, fmt.Errorf("%w: id %q", ErrEventTypeNotFound, req.EventTypeID)
	}

	start := req.Start
	if !isWithinWindow(start, now) {
		return Booking{}, ErrSlotOutOfWindow
	}
	if !isValidSlotBoundary(et, s.owner, start) {
		return Booking{}, ErrInvalidSlot
	}

	end := start.Add(time.Duration(et.DurationMinutes) * time.Minute)
	if s.hasOverlapLocked(start, end) {
		return Booking{}, ErrSlotTaken
	}

	s.nextBookingID++
	booking := Booking{
		ID:            fmt.Sprintf("bk-%d", s.nextBookingID),
		EventTypeID:   et.ID,
		EventTypeName: et.Name,
		Start:         start,
		End:           end,
		GuestName:     req.GuestName,
		GuestEmail:    req.GuestEmail,
		Note:          req.Note,
		CreatedAt:     now,
	}
	s.bookings = append(s.bookings, booking)
	return booking, nil
}

func (s *Store) ListBookings(from time.Time) []Booking {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]Booking, 0, len(s.bookings))
	for _, b := range s.bookings {
		if !b.Start.Before(from) {
			result = append(result, b)
		}
	}
	sort.Slice(result, func(i, j int) bool { return result[i].Start.Before(result[j].Start) })
	return result
}

func (s *Store) GetBooking(id string) (Booking, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, b := range s.bookings {
		if b.ID == id {
			return b, nil
		}
	}
	return Booking{}, fmt.Errorf("%w: id %q", ErrBookingNotFound, id)
}
