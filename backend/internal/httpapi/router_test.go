package httpapi

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"backend/internal/booking"
)

func TestNewRouter_APIPrefixMount(t *testing.T) {
	router := NewRouter(booking.NewStore(), "http://localhost:5173", "")

	req := httptest.NewRequest(http.MethodGet, "/api/owner", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("GET /api/owner status = %d, want 200: %s", rec.Code, rec.Body.String())
	}
}

func TestNewRouter_APIWildcardMount(t *testing.T) {
	router := NewRouter(booking.NewStore(), "http://localhost:5173", "")

	create := booking.CreateEventTypeRequest{ID: "consult", Name: "Consultation", DurationMinutes: 30}
	rec := doRequest(t, router, http.MethodPost, "/api/event-types", create)
	if rec.Code != http.StatusCreated {
		t.Fatalf("POST /api/event-types status = %d, want 201: %s", rec.Code, rec.Body.String())
	}

	rec = doRequest(t, router, http.MethodGet, "/api/event-types/consult/slots", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("GET /api/event-types/consult/slots status = %d, want 200: %s", rec.Code, rec.Body.String())
	}
}

func TestNewRouter_SPAFallback(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("<html>shell</html>"), 0o644); err != nil {
		t.Fatalf("write index.html: %v", err)
	}

	router := NewRouter(booking.NewStore(), "http://localhost:5173", dir)

	rec := doRequest(t, router, http.MethodGet, "/event-types/abc123", nil)
	if rec.Code != http.StatusOK || rec.Body.String() != "<html>shell</html>" {
		t.Fatalf("SPA fallback: status=%d body=%q", rec.Code, rec.Body.String())
	}

	rec = doRequest(t, router, http.MethodGet, "/assets/missing.js", nil)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("missing asset status = %d, want 404", rec.Code)
	}
}
