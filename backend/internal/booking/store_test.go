package booking

import (
	"errors"
	"sync"
	"testing"
	"time"
)

// fixedNow is a Monday, 06:00 in Europe/Moscow (03:00 UTC) — before that
// day's business hours start, so the whole 14-day window is still ahead.
var fixedNow = time.Date(2024, time.January, 8, 3, 0, 0, 0, time.UTC)

func newTestStore(t *testing.T) (*Store, EventType) {
	t.Helper()
	s := NewStore()
	et, err := s.CreateEventType(CreateEventTypeRequest{
		ID:              "consult",
		Name:            "Consultation",
		Description:     "30-minute call",
		DurationMinutes: 30,
	})
	if err != nil {
		t.Fatalf("CreateEventType: %v", err)
	}
	return s, et
}

func TestGenerateSlots_BusinessHoursOnly(t *testing.T) {
	s, et := newTestStore(t)
	owner := s.GetOwner()

	slots := generateSlots(et, owner, fixedNow)
	if len(slots) == 0 {
		t.Fatal("expected at least one slot")
	}

	loc := ownerLocation(owner)
	windowEnd := fixedNow.Add(windowDays * 24 * time.Hour)

	for _, slot := range slots {
		local := slot.Start.In(loc)
		if wd := local.Weekday(); wd == time.Saturday || wd == time.Sunday {
			t.Errorf("slot on weekend: %v (%v)", slot.Start, wd)
		}
		if local.Hour() < businessStartHour {
			t.Errorf("slot starts before business hours: %v", slot.Start)
		}
		localEnd := slot.End.In(loc)
		endMinutes := localEnd.Hour()*60 + localEnd.Minute()
		if endMinutes > businessEndHour*60 {
			t.Errorf("slot ends after business hours: %v", slot.End)
		}
		if slot.Start.Before(fixedNow) {
			t.Errorf("slot in the past: %v", slot.Start)
		}
		if slot.Start.After(windowEnd) {
			t.Errorf("slot beyond 14-day window: %v", slot.Start)
		}
	}

	wantFirst := time.Date(2024, time.January, 8, businessStartHour, 0, 0, 0, loc).UTC()
	if !slots[0].Start.Equal(wantFirst) {
		t.Errorf("first slot = %v, want %v", slots[0].Start, wantFirst)
	}
}

func TestCreateBooking_ConflictSameSlot(t *testing.T) {
	s, et := newTestStore(t)
	slots, err := s.AvailableSlots(et.ID, fixedNow)
	if err != nil || len(slots) == 0 {
		t.Fatalf("AvailableSlots: %v, %d slots", err, len(slots))
	}
	req := CreateBookingRequest{
		EventTypeID: et.ID,
		Start:       slots[0].Start,
		GuestName:   "Guest One",
		GuestEmail:  "guest1@example.com",
	}

	if _, err := s.CreateBooking(req, fixedNow); err != nil {
		t.Fatalf("first booking should succeed: %v", err)
	}

	req.GuestEmail = "guest2@example.com"
	req.GuestName = "Guest Two"
	_, err = s.CreateBooking(req, fixedNow)
	if !errors.Is(err, ErrSlotTaken) {
		t.Fatalf("second booking on same slot: got %v, want ErrSlotTaken", err)
	}
}

func TestCreateBooking_GlobalOccupancyAcrossEventTypes(t *testing.T) {
	s, et := newTestStore(t)
	other, err := s.CreateEventType(CreateEventTypeRequest{
		ID:              "other",
		Name:            "Other",
		DurationMinutes: 30,
	})
	if err != nil {
		t.Fatalf("CreateEventType: %v", err)
	}

	slots, err := s.AvailableSlots(et.ID, fixedNow)
	if err != nil || len(slots) == 0 {
		t.Fatalf("AvailableSlots: %v", err)
	}

	if _, err := s.CreateBooking(CreateBookingRequest{
		EventTypeID: et.ID,
		Start:       slots[0].Start,
		GuestName:   "Guest One",
		GuestEmail:  "guest1@example.com",
	}, fixedNow); err != nil {
		t.Fatalf("first booking should succeed: %v", err)
	}

	_, err = s.CreateBooking(CreateBookingRequest{
		EventTypeID: other.ID,
		Start:       slots[0].Start,
		GuestName:   "Guest Two",
		GuestEmail:  "guest2@example.com",
	}, fixedNow)
	if !errors.Is(err, ErrSlotTaken) {
		t.Fatalf("booking a different event type at the same time: got %v, want ErrSlotTaken", err)
	}
}

func TestCreateBooking_OutOfWindow(t *testing.T) {
	s, et := newTestStore(t)
	tooFar := fixedNow.Add((windowDays + 1) * 24 * time.Hour)

	_, err := s.CreateBooking(CreateBookingRequest{
		EventTypeID: et.ID,
		Start:       tooFar,
		GuestName:   "Guest",
		GuestEmail:  "guest@example.com",
	}, fixedNow)
	if !errors.Is(err, ErrSlotOutOfWindow) {
		t.Fatalf("booking beyond window: got %v, want ErrSlotOutOfWindow", err)
	}
}

func TestCreateBooking_InPastIsOutOfWindow(t *testing.T) {
	s, et := newTestStore(t)
	_, err := s.CreateBooking(CreateBookingRequest{
		EventTypeID: et.ID,
		Start:       fixedNow.Add(-time.Hour),
		GuestName:   "Guest",
		GuestEmail:  "guest@example.com",
	}, fixedNow)
	if !errors.Is(err, ErrSlotOutOfWindow) {
		t.Fatalf("booking in the past: got %v, want ErrSlotOutOfWindow", err)
	}
}

func TestCreateBooking_InvalidSlotBoundary(t *testing.T) {
	s, et := newTestStore(t)
	loc := ownerLocation(s.GetOwner())
	misaligned := time.Date(2024, time.January, 8, businessStartHour, 7, 0, 0, loc).UTC()

	_, err := s.CreateBooking(CreateBookingRequest{
		EventTypeID: et.ID,
		Start:       misaligned,
		GuestName:   "Guest",
		GuestEmail:  "guest@example.com",
	}, fixedNow)
	if !errors.Is(err, ErrInvalidSlot) {
		t.Fatalf("misaligned slot: got %v, want ErrInvalidSlot", err)
	}
}

func TestCreateEventType_DuplicateID(t *testing.T) {
	s, et := newTestStore(t)
	_, err := s.CreateEventType(CreateEventTypeRequest{
		ID:              et.ID,
		Name:            "Duplicate",
		DurationMinutes: 15,
	})
	if !errors.Is(err, ErrEventTypeExists) {
		t.Fatalf("duplicate event type id: got %v, want ErrEventTypeExists", err)
	}
}

func TestCreateBooking_ConcurrentRaceOnlyOneWins(t *testing.T) {
	s, et := newTestStore(t)
	slots, err := s.AvailableSlots(et.ID, fixedNow)
	if err != nil || len(slots) == 0 {
		t.Fatalf("AvailableSlots: %v", err)
	}
	start := slots[0].Start

	const attempts = 20
	var wg sync.WaitGroup
	successes := make([]bool, attempts)
	for i := 0; i < attempts; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			_, err := s.CreateBooking(CreateBookingRequest{
				EventTypeID: et.ID,
				Start:       start,
				GuestName:   "Guest",
				GuestEmail:  "guest@example.com",
			}, fixedNow)
			successes[i] = err == nil
		}(i)
	}
	wg.Wait()

	won := 0
	for _, ok := range successes {
		if ok {
			won++
		}
	}
	if won != 1 {
		t.Fatalf("expected exactly 1 successful booking out of %d concurrent attempts, got %d", attempts, won)
	}
}
