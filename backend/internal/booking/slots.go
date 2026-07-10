package booking

import "time"

const (
	businessStartHour = 9
	businessEndHour   = 18
	windowDays        = 14
)

func ownerLocation(owner Owner) *time.Location {
	loc, err := time.LoadLocation(owner.TimeZone)
	if err != nil {
		return time.UTC
	}
	return loc
}

// isValidSlotBoundary reports whether start (any instant) lands exactly on a
// business-hours slot boundary for the given event type, in the owner's
// local time zone: a weekday, aligned to the duration step from 09:00, and
// ending at or before 18:00.
func isValidSlotBoundary(et EventType, owner Owner, start time.Time) bool {
	loc := ownerLocation(owner)
	local := start.In(loc)

	switch local.Weekday() {
	case time.Saturday, time.Sunday:
		return false
	}

	duration := time.Duration(et.DurationMinutes) * time.Minute
	if duration <= 0 {
		return false
	}

	dayStart := time.Date(local.Year(), local.Month(), local.Day(), businessStartHour, 0, 0, 0, loc)
	dayEnd := time.Date(local.Year(), local.Month(), local.Day(), businessEndHour, 0, 0, 0, loc)

	if local.Before(dayStart) || local.After(dayEnd) {
		return false
	}
	if local.Add(duration).After(dayEnd) {
		return false
	}

	diff := local.Sub(dayStart)
	return diff%duration == 0
}

// isWithinWindow reports whether start falls within [now, now+14d].
func isWithinWindow(start, now time.Time) bool {
	if start.Before(now) {
		return false
	}
	return !start.After(now.Add(windowDays * 24 * time.Hour))
}

// generateSlots returns every business-hours slot boundary for et over the
// next 14 days (from now), in owner's local time zone, expressed in UTC.
// It does not exclude already-booked times; the store subtracts those.
func generateSlots(et EventType, owner Owner, now time.Time) []Slot {
	loc := ownerLocation(owner)
	duration := time.Duration(et.DurationMinutes) * time.Minute
	if duration <= 0 {
		return nil
	}

	nowLocal := now.In(loc)
	startDay := time.Date(nowLocal.Year(), nowLocal.Month(), nowLocal.Day(), 0, 0, 0, 0, loc)

	var slots []Slot
	for dayOffset := 0; dayOffset <= windowDays; dayOffset++ {
		day := startDay.AddDate(0, 0, dayOffset)
		switch day.Weekday() {
		case time.Saturday, time.Sunday:
			continue
		}

		dayStart := time.Date(day.Year(), day.Month(), day.Day(), businessStartHour, 0, 0, 0, loc)
		dayEnd := time.Date(day.Year(), day.Month(), day.Day(), businessEndHour, 0, 0, 0, loc)

		for slotStart := dayStart; !slotStart.Add(duration).After(dayEnd); slotStart = slotStart.Add(duration) {
			startUTC := slotStart.UTC()
			if !isWithinWindow(startUTC, now) {
				continue
			}
			slots = append(slots, Slot{Start: startUTC, End: slotStart.Add(duration).UTC()})
		}
	}
	return slots
}
