import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./server";

// jsdom does not implement matchMedia; next-themes/sonner call it on mount.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// vitest.config.ts does not enable `test.globals`, so @testing-library/react's
// built-in auto-cleanup (which only registers when `afterEach` is a global)
// never runs. Without this, DOM from previous tests in the same file stays
// mounted, causing duplicate-element failures in files with multiple `it`s
// that render the same labels/text.
afterEach(() => cleanup());
