package httpapi

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"backend/internal/booking"
)

func newTestRouter() http.Handler {
	return NewRouter(booking.NewStore(), "http://localhost:5173")
}

func doRequest(t *testing.T, router http.Handler, method, path string, body any) *httptest.ResponseRecorder {
	t.Helper()

	var reader *bytes.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("marshal request body: %v", err)
		}
		reader = bytes.NewReader(b)
	} else {
		reader = bytes.NewReader(nil)
	}

	req := httptest.NewRequest(method, path, reader)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	return rec
}

func decodeBody[T any](t *testing.T, rec *httptest.ResponseRecorder) T {
	t.Helper()
	var v T
	if err := json.Unmarshal(rec.Body.Bytes(), &v); err != nil {
		t.Fatalf("decode response body %q: %v", rec.Body.String(), err)
	}
	return v
}

func TestGetOwner(t *testing.T) {
	router := newTestRouter()
	rec := doRequest(t, router, http.MethodGet, "/owner", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	owner := decodeBody[booking.Owner](t, rec)
	if owner.ID == "" || owner.Email == "" || owner.TimeZone == "" {
		t.Fatalf("owner missing fields: %+v", owner)
	}
}

func TestEventTypeLifecycle(t *testing.T) {
	router := newTestRouter()

	create := booking.CreateEventTypeRequest{ID: "consult", Name: "Consultation", DurationMinutes: 30}
	rec := doRequest(t, router, http.MethodPost, "/event-types", create)
	if rec.Code != http.StatusCreated {
		t.Fatalf("create status = %d, want 201: %s", rec.Code, rec.Body.String())
	}

	rec = doRequest(t, router, http.MethodPost, "/event-types", create)
	if rec.Code != http.StatusConflict {
		t.Fatalf("duplicate create status = %d, want 409: %s", rec.Code, rec.Body.String())
	}
	apiErr := decodeBody[booking.ApiError](t, rec)
	if apiErr.Code != "event_type_exists" {
		t.Fatalf("error code = %q, want event_type_exists", apiErr.Code)
	}

	rec = doRequest(t, router, http.MethodGet, "/event-types", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("list status = %d, want 200", rec.Code)
	}
	list := decodeBody[[]booking.EventType](t, rec)
	if len(list) != 1 {
		t.Fatalf("list len = %d, want 1", len(list))
	}

	rec = doRequest(t, router, http.MethodGet, "/event-types/consult", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("read status = %d, want 200", rec.Code)
	}

	rec = doRequest(t, router, http.MethodGet, "/event-types/missing", nil)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("read missing status = %d, want 404", rec.Code)
	}
	apiErr = decodeBody[booking.ApiError](t, rec)
	if apiErr.Code != "event_type_not_found" {
		t.Fatalf("error code = %q, want event_type_not_found", apiErr.Code)
	}
}

func TestCreateEventType_InvalidBody(t *testing.T) {
	router := newTestRouter()
	rec := doRequest(t, router, http.MethodPost, "/event-types", booking.CreateEventTypeRequest{ID: "x", DurationMinutes: 30})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422: %s", rec.Code, rec.Body.String())
	}
	apiErr := decodeBody[booking.ApiError](t, rec)
	if apiErr.Code != "invalid_event_type" {
		t.Fatalf("error code = %q, want invalid_event_type", apiErr.Code)
	}
}

func TestBookingFlow(t *testing.T) {
	router := newTestRouter()

	create := booking.CreateEventTypeRequest{ID: "consult", Name: "Consultation", DurationMinutes: 30}
	if rec := doRequest(t, router, http.MethodPost, "/event-types", create); rec.Code != http.StatusCreated {
		t.Fatalf("create event type: %d %s", rec.Code, rec.Body.String())
	}

	rec := doRequest(t, router, http.MethodGet, "/event-types/consult/slots", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("slots status = %d, want 200: %s", rec.Code, rec.Body.String())
	}
	slots := decodeBody[[]booking.Slot](t, rec)
	if len(slots) == 0 {
		t.Fatal("expected at least one available slot")
	}

	bookingReq := booking.CreateBookingRequest{
		EventTypeID: "consult",
		Start:       slots[0].Start,
		GuestName:   "Guest One",
		GuestEmail:  "guest1@example.com",
	}
	rec = doRequest(t, router, http.MethodPost, "/bookings", bookingReq)
	if rec.Code != http.StatusCreated {
		t.Fatalf("create booking status = %d, want 201: %s", rec.Code, rec.Body.String())
	}
	created := decodeBody[booking.Booking](t, rec)
	if created.ID == "" {
		t.Fatal("created booking has no id")
	}

	rec = doRequest(t, router, http.MethodPost, "/bookings", bookingReq)
	if rec.Code != http.StatusConflict {
		t.Fatalf("duplicate booking status = %d, want 409: %s", rec.Code, rec.Body.String())
	}
	apiErr := decodeBody[booking.ApiError](t, rec)
	if apiErr.Code != "slot_taken" {
		t.Fatalf("error code = %q, want slot_taken", apiErr.Code)
	}

	rec = doRequest(t, router, http.MethodGet, "/bookings", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("list bookings status = %d, want 200", rec.Code)
	}
	list := decodeBody[[]booking.Booking](t, rec)
	if len(list) != 1 {
		t.Fatalf("bookings list len = %d, want 1", len(list))
	}

	rec = doRequest(t, router, http.MethodGet, "/bookings/"+created.ID, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("get booking status = %d, want 200", rec.Code)
	}

	rec = doRequest(t, router, http.MethodGet, "/bookings/missing", nil)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("get missing booking status = %d, want 404", rec.Code)
	}
}

func TestCreateBooking_UnknownEventType(t *testing.T) {
	router := newTestRouter()
	rec := doRequest(t, router, http.MethodPost, "/bookings", booking.CreateBookingRequest{
		EventTypeID: "missing",
		Start:       time.Now().Add(24 * time.Hour),
		GuestName:   "Guest",
		GuestEmail:  "guest@example.com",
	})
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404: %s", rec.Code, rec.Body.String())
	}
	apiErr := decodeBody[booking.ApiError](t, rec)
	if apiErr.Code != "event_type_not_found" {
		t.Fatalf("error code = %q, want event_type_not_found", apiErr.Code)
	}
}
