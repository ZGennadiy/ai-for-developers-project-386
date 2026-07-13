package httpapi

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// newSPAHandler serves the built frontend from dir. If the requested path
// matches a file on disk, it is served as-is. Otherwise -- unless the last
// path segment looks like a static asset request (contains a ".", e.g. a
// missing/renamed hashed .js/.css chunk, which should 404 rather than
// silently return HTML with the wrong Content-Type) -- it falls back to
// dir/index.html so client-side routing (react-router) can render the
// matching SPA route.
func newSPAHandler(dir string) http.Handler {
	fileServer := http.FileServer(http.Dir(dir))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cleaned := filepath.Clean("/" + r.URL.Path)

		if info, err := os.Stat(filepath.Join(dir, cleaned)); err == nil && !info.IsDir() {
			fileServer.ServeHTTP(w, r)
			return
		}

		if strings.Contains(filepath.Base(cleaned), ".") {
			http.NotFound(w, r)
			return
		}

		// http.ServeFile (unlike routing an "/index.html" path back through
		// fileServer) keys its "redirect .../index.html to .../" special
		// case off r.URL.Path, which here is still the original SPA route
		// (e.g. "/event-types/abc123"), so it serves the file directly
		// instead of redirecting.
		http.ServeFile(w, r, filepath.Join(dir, "index.html"))
	})
}
