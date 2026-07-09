# Frontend UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working React/TypeScript UI in `frontend/` that implements every guest and owner scenario from the TypeSpec contract in `spec/`, running against a Prism mock in development.

**Architecture:** Vite + React + TypeScript SPA using shadcn/ui components, TanStack Query for server state, react-hook-form + zod for forms, and react-router-dom for navigation between a guest section (browse event types → view slots → book) and an owner section (view upcoming bookings, create event types). A hand-written API layer (`src/lib/api/*`) mirrors `spec/models.tsp` exactly. Vitest + React Testing Library + MSW provide fast, no-process-needed tests; Prism (mocking the compiled OpenAPI) is used for manual, real-HTTP verification.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v4, shadcn/ui, react-router-dom v6, @tanstack/react-query v5, react-hook-form, zod, @hookform/resolvers, sonner (toasts), Vitest, @testing-library/react, msw, @typespec/compiler, @stoplight/prism-cli.

## Global Constraints

- UI copy is in Russian throughout (matches `docs/domain.md` / README).
- Every `utcDateTime` value (slots, bookings) is displayed formatted in `Owner.timeZone` (from `GET /owner`), never the browser's local timezone.
- Frontend lives in its own directory, `frontend/`, independent of `spec/`/`docs/`.
- API base URL is configurable via `VITE_API_BASE_URL` (default `http://localhost:4010`, Prism's default port).
- Do not modify any file under `spec/` — the contract is merged and frozen for this step.
- All API error responses share the `{ code, message }` shape (`ApiError` in the contract) for 404/409/422.
- No authentication/authorization — the contract has none.
- No destructive git operations; work happens on the existing `feature/frontend-ui` branch with regular commits.

---

## File Structure Overview

```
.gitignore                          # new — root ignores (node_modules, dist, tsp-output, env)
package.json                        # new — root tooling: TypeSpec compiler + Prism scripts
README.md                           # modified — add "Фронтенд" section

frontend/
  package.json, vite.config.ts, tsconfig*.json, index.html, components.json
  .env                               # VITE_API_BASE_URL=http://localhost:4010
  src/
    main.tsx, App.tsx, index.css
    components/
      layout/AppLayout.tsx
      slots/SlotsCalendar.tsx
      bookings/BookingDialog.tsx
      ui/...                         # shadcn-generated primitives
    pages/
      EventTypesPage.tsx             # "/"
      EventTypeDetailPage.tsx        # "/event-types/:eventTypeId"
      BookingConfirmationPage.tsx    # "/bookings/:bookingId"
      OwnerBookingsPage.tsx          # "/owner"
      OwnerEventTypesPage.tsx        # "/owner/event-types"
    hooks/
      useOwner.ts, useEventTypes.ts, useSlots.ts, useBookings.ts
    lib/
      format.ts                     # timezone formatting + slot grouping
      api/
        types.ts, client.ts, owner.ts, eventTypes.ts, slots.ts, bookings.ts
    test/
      setup.ts, server.ts, handlers.ts, render.tsx
```

---

### Task 1: Scaffold the frontend app (Vite + React + TS + Tailwind + shadcn/ui)

**Files:**
- Create: `.gitignore`
- Create: `frontend/` (via `npm create vite@latest`)
- Modify: `frontend/tsconfig.app.json` (path alias)
- Modify: `frontend/vite.config.ts` (path alias, Tailwind plugin)
- Create: `frontend/src/lib/` (empty dir, placeholder for later tasks — created implicitly when Task 2 adds files)

**Interfaces:**
- Produces: `@/*` import alias resolving to `frontend/src/*`, usable by every later task.
- Produces: shadcn primitives under `frontend/src/components/ui/*` (`button`, `card`, `dialog`, `form`, `input`, `textarea`, `skeleton`, `sonner`, `table`, `label`).

- [ ] **Step 1: Add root `.gitignore`**

```gitignore
node_modules/
dist/
dist-ssr/
tsp-output/
*.local
.env.local
.env.*.local
.DS_Store
```

- [ ] **Step 2: Scaffold the Vite React+TS app**

Run from the repo root:
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```
Expected: `frontend/` now contains `package.json`, `src/`, `index.html`, etc.

- [ ] **Step 3: Configure the `@/*` path alias**

Edit `frontend/tsconfig.app.json`, add inside `compilerOptions`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 4: Initialize shadcn/ui (installs Tailwind v4 + Vite plugin + `components.json`)**

Still inside `frontend/`:
```bash
npx shadcn@latest init -d -y
```
This detects the Vite + React setup, installs `tailwindcss`, `@tailwindcss/vite`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, writes `components.json`, updates `src/index.css` with `@import "tailwindcss";`, and adds the `tailwindcss()` plugin plus the `@` alias to `vite.config.ts`. If it prompts interactively despite the flags, accept the defaults (base color: Neutral, CSS variables: Yes).

After it finishes, open `frontend/vite.config.ts` and confirm it contains a `resolve.alias` entry mapping `@` to `./src` (add it manually if the CLI didn't):
```ts
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 5: Add the shadcn components used across the app**

```bash
npx shadcn@latest add button card dialog form input textarea skeleton sonner table
```
Expected: `frontend/src/components/ui/` now has `button.tsx`, `card.tsx`, `dialog.tsx`, `form.tsx`, `input.tsx`, `textarea.tsx`, `skeleton.tsx`, `sonner.tsx`, `table.tsx`, `label.tsx`.

- [ ] **Step 6: Install app dependencies (routing, server state, forms)**

```bash
npm install react-router-dom @tanstack/react-query react-hook-form zod @hookform/resolvers
```

- [ ] **Step 7: Verify the scaffold builds**

```bash
npm run build
```
Expected: exits 0, `frontend/dist/` is created.

- [ ] **Step 8: Commit**

```bash
git add .gitignore frontend
git commit -m "Scaffold Vite/React/TS frontend with Tailwind and shadcn/ui"
```

---

### Task 2: Test tooling + API core (types, fetch client, MSW harness)

**Files:**
- Modify: `frontend/vite.config.ts` (add `test` block)
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/test/server.ts`
- Create: `frontend/src/test/handlers.ts`
- Create: `frontend/src/test/render.tsx`
- Create: `frontend/src/lib/api/types.ts`
- Create: `frontend/src/lib/api/client.ts`
- Test: `frontend/src/lib/api/client.test.ts`
- Create: `frontend/.env`

**Interfaces:**
- Produces: `Owner`, `EventType`, `Slot`, `Booking`, `CreateBookingRequest`, `CreateEventTypeRequest`, `ApiErrorPayload` types from `@/lib/api/types` — every later API module and component uses these.
- Produces: `apiRequest<T>(path, options?): Promise<T>` and `class ApiError extends Error { code: string; status: number }` from `@/lib/api/client` — every later API module uses `apiRequest`; components use `ApiError` to branch on `status`/`code`.
- Produces: `server` (MSW `setupServer` instance) from `@/test/server`, base `handlers` from `@/test/handlers`, `renderWithProviders(ui, { route?, path? })` from `@/test/render` — every later test task uses these. `renderWithProviders` also mounts `<Toaster />` (Sonner only renders toasts through a mounted `Toaster`; without it, `toast.error(...)`/`toast.success(...)` calls in Tasks 11 and 14 would produce no DOM output for `findByText` assertions to catch).

- [ ] **Step 1: Install test dependencies**

```bash
cd frontend
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw
```

- [ ] **Step 2: Add Vitest config to `vite.config.ts`**

Add a `test` property to the `defineConfig({...})` object from Task 1:
```ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

- [ ] **Step 3: `.env` with the API base URL**

`frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:4010
```

- [ ] **Step 4: Write the domain types**

`frontend/src/lib/api/types.ts`:
```ts
export interface Owner {
  id: string;
  name: string;
  email: string;
  timeZone: string;
}

export interface EventType {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
}

export interface Slot {
  start: string;
  end: string;
}

export interface Booking {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  start: string;
  end: string;
  guestName: string;
  guestEmail: string;
  note?: string;
  createdAt: string;
}

export interface CreateBookingRequest {
  eventTypeId: string;
  start: string;
  guestName: string;
  guestEmail: string;
  note?: string;
}

export interface CreateEventTypeRequest {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
}
```

- [ ] **Step 5: Write the MSW test harness (server, handlers, render helper)**

`frontend/src/test/handlers.ts`:
```ts
import { http, HttpResponse } from "msw";

const BASE_URL = "http://localhost:4010";

export const ownerFixture = {
  id: "owner-1",
  name: "Алина Смирнова",
  email: "alina@example.com",
  timeZone: "Europe/Moscow",
};

export const eventTypesFixture = [
  {
    id: "intro-call",
    name: "Знакомство",
    description: "Короткий созвон на знакомство",
    durationMinutes: 30,
  },
];

export const slotsFixture = [
  { start: "2026-07-10T09:00:00Z", end: "2026-07-10T09:30:00Z" },
  { start: "2026-07-10T10:00:00Z", end: "2026-07-10T10:30:00Z" },
];

export const bookingFixture = {
  id: "booking-1",
  eventTypeId: "intro-call",
  eventTypeName: "Знакомство",
  start: "2026-07-10T09:00:00Z",
  end: "2026-07-10T09:30:00Z",
  guestName: "Иван Гость",
  guestEmail: "ivan@example.com",
  createdAt: "2026-07-09T12:00:00Z",
};

export const handlers = [
  http.get(`${BASE_URL}/owner`, () => HttpResponse.json({ owner: ownerFixture })),

  http.get(`${BASE_URL}/event-types`, () =>
    HttpResponse.json({ eventTypes: eventTypesFixture })
  ),

  http.get(`${BASE_URL}/event-types/:eventTypeId`, ({ params }) => {
    const eventType = eventTypesFixture.find((item) => item.id === params.eventTypeId);
    if (!eventType) {
      return HttpResponse.json(
        { code: "event_type_not_found", message: "Тип события не найден" },
        { status: 404 }
      );
    }
    return HttpResponse.json({ eventType });
  }),

  http.get(`${BASE_URL}/event-types/:eventTypeId/slots`, ({ params }) => {
    const eventType = eventTypesFixture.find((item) => item.id === params.eventTypeId);
    if (!eventType) {
      return HttpResponse.json(
        { code: "event_type_not_found", message: "Тип события не найден" },
        { status: 404 }
      );
    }
    return HttpResponse.json({ slots: slotsFixture });
  }),

  http.post(`${BASE_URL}/event-types`, async ({ request }) => {
    const body = (await request.json()) as { id: string };
    if (eventTypesFixture.some((item) => item.id === body.id)) {
      return HttpResponse.json(
        { code: "event_type_exists", message: "Тип события с таким id уже существует" },
        { status: 409 }
      );
    }
    return HttpResponse.json({ created: body }, { status: 201 });
  }),

  http.post(`${BASE_URL}/bookings`, () =>
    HttpResponse.json({ created: bookingFixture }, { status: 201 })
  ),

  http.get(`${BASE_URL}/bookings`, () =>
    HttpResponse.json({ bookings: [bookingFixture] })
  ),

  http.get(`${BASE_URL}/bookings/:bookingId`, ({ params }) => {
    if (params.bookingId !== bookingFixture.id) {
      return HttpResponse.json(
        { code: "booking_not_found", message: "Бронирование не найдено" },
        { status: 404 }
      );
    }
    return HttpResponse.json({ booking: bookingFixture });
  }),
];
```

`frontend/src/test/server.ts`:
```ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

`frontend/src/test/setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

`frontend/src/test/render.tsx`:
```tsx
import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

interface RenderOptions {
  route?: string;
  path?: string;
}

export function renderWithProviders(ui: ReactElement, { route = "/", path }: RenderOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const content = path ? (
    <Routes>
      <Route path={path} element={ui} />
    </Routes>
  ) : (
    ui
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        {content}
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 6: Write the failing test for the fetch client**

`frontend/src/lib/api/client.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { apiRequest, ApiError } from "./client";

describe("apiRequest", () => {
  it("returns parsed JSON on success", async () => {
    server.use(
      http.get("http://localhost:4010/owner", () =>
        HttpResponse.json({ owner: { id: "1", name: "Test", email: "a@b.com", timeZone: "UTC" } })
      )
    );

    const result = await apiRequest<{ owner: { id: string } }>("/owner");
    expect(result.owner.id).toBe("1");
  });

  it("throws ApiError with code, message and status on error response", async () => {
    server.use(
      http.get("http://localhost:4010/owner", () =>
        HttpResponse.json({ code: "not_found", message: "Владелец не найден" }, { status: 404 })
      )
    );

    await expect(apiRequest("/owner")).rejects.toMatchObject({
      code: "not_found",
      message: "Владелец не найден",
      status: 404,
    });
  });

  it("sends a JSON body for POST requests", async () => {
    let capturedBody: unknown;
    server.use(
      http.post("http://localhost:4010/bookings", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ created: capturedBody }, { status: 201 });
      })
    );

    await apiRequest("/bookings", { method: "POST", body: { guestName: "Иван" } });
    expect(capturedBody).toEqual({ guestName: "Иван" });
  });
});
```

- [ ] **Step 7: Run the test to verify it fails**

```bash
npx vitest run src/lib/api/client.test.ts
```
Expected: FAIL — `client.ts` does not exist yet (`Cannot find module './client'`).

- [ ] **Step 8: Implement the fetch client**

`frontend/src/lib/api/client.ts`:
```ts
import type { ApiErrorPayload } from "./types";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.code = payload.code;
    this.status = status;
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4010";

interface RequestOptions {
  method?: string;
  body?: unknown;
  searchParams?: Record<string, string | undefined>;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(path, BASE_URL);
  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const payload = (await response.json()) as ApiErrorPayload;
    throw new ApiError(response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
```

- [ ] **Step 9: Run the test to verify it passes**

```bash
npx vitest run src/lib/api/client.test.ts
```
Expected: PASS (3 tests).

- [ ] **Step 10: Commit**

```bash
git add frontend
git commit -m "Add Vitest/MSW test harness and typed API fetch client"
```

---

### Task 3: Root tooling — TypeSpec compile + Prism mock scripts

**Files:**
- Create: `package.json` (repo root)
- Modify: `README.md`

**Interfaces:**
- Produces: `npm run spec:compile` (generates `tsp-output/@typespec/openapi3/openapi.yaml`) and `npm run mock` (serves it via Prism on port 4010) — used by Task 15's manual verification.

- [ ] **Step 1: Create the root package.json and install tooling**

```bash
npm init -y
npm install --save-dev @typespec/compiler @typespec/http @typespec/openapi3 @stoplight/prism-cli
```

- [ ] **Step 2: Add scripts to the root `package.json`**

Edit the generated `package.json`, add a `"scripts"` key:
```json
{
  "scripts": {
    "spec:compile": "tsp compile spec/main.tsp --emit @typespec/openapi3",
    "mock": "prism mock tsp-output/@typespec/openapi3/openapi.yaml"
  }
}
```

- [ ] **Step 3: Verify the compile step**

```bash
npm run spec:compile
```
Expected: exits 0, creates `tsp-output/@typespec/openapi3/openapi.yaml`.

- [ ] **Step 4: Update root README with a "Фронтенд" section**

Add to `README.md`, after the existing "API-контракт (TypeSpec)" section:
```markdown
## Фронтенд

UI в каталоге [frontend/](frontend) — React + TypeScript + shadcn/ui, реализует
все сценарии контракта. Подробности запуска — в [frontend/README.md](frontend/README.md).

Для разработки фронтенда без реального бэкенда используется Prism, поднятый
из контракта:

\`\`\`bash
npm install
npm run spec:compile
npm run mock          # запускает Prism на http://localhost:4010
\`\`\`

Затем в отдельном терминале:

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json README.md
git commit -m "Add root TypeSpec/Prism tooling and document frontend dev workflow"
```

---

### Task 4: Owner API, hook, and timezone formatting utility

**Files:**
- Create: `frontend/src/lib/api/owner.ts`
- Create: `frontend/src/lib/format.ts`
- Create: `frontend/src/hooks/useOwner.ts`
- Test: `frontend/src/lib/format.test.ts`
- Test: `frontend/src/lib/api/owner.test.ts`

**Interfaces:**
- Consumes: `apiRequest` from `@/lib/api/client` (Task 2); `Owner`, `Slot` from `@/lib/api/types` (Task 2).
- Produces: `getOwner(): Promise<Owner>` from `@/lib/api/owner`; `useOwner()` (TanStack Query hook) from `@/hooks/useOwner` — used by every page that displays times or the owner's name/email (Tasks 9–14).
- Produces: `formatInTimeZone(iso: string, timeZone: string, options?: Intl.DateTimeFormatOptions): string` and `groupSlotsByDay(slots: Slot[], timeZone: string): Array<{ day: string; slots: Slot[] }>` from `@/lib/format` — used by `SlotsCalendar` (Task 6/10) and the confirmation/owner pages (Tasks 12–13).

- [ ] **Step 1: Write the failing tests**

`frontend/src/lib/format.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { formatInTimeZone, groupSlotsByDay } from "./format";

describe("formatInTimeZone", () => {
  it("formats an ISO instant in the given IANA timezone", () => {
    const result = formatInTimeZone("2026-07-10T09:00:00Z", "Europe/Moscow", {
      hour: "2-digit",
      minute: "2-digit",
    });
    expect(result).toContain("12"); // UTC+3
  });
});

describe("groupSlotsByDay", () => {
  it("groups slots by calendar day in the target timezone, sorted ascending", () => {
    const slots = [
      { start: "2026-07-11T09:00:00Z", end: "2026-07-11T09:30:00Z" },
      { start: "2026-07-10T21:30:00Z", end: "2026-07-10T22:00:00Z" }, // 2026-07-11 00:30 Moscow
      { start: "2026-07-10T09:00:00Z", end: "2026-07-10T09:30:00Z" },
    ];

    const groups = groupSlotsByDay(slots, "Europe/Moscow");

    expect(groups).toHaveLength(2);
    expect(groups[0].day).toBe("2026-07-10");
    expect(groups[0].slots).toHaveLength(1);
    expect(groups[1].day).toBe("2026-07-11");
    expect(groups[1].slots).toHaveLength(2);
  });
});
```

`frontend/src/lib/api/owner.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { ownerFixture } from "@/test/handlers";
import { getOwner } from "./owner";

describe("getOwner", () => {
  it("returns the owner from the response envelope", async () => {
    const owner = await getOwner();
    expect(owner).toEqual(ownerFixture);
  });

  it("propagates a 404 as ApiError", async () => {
    server.use(
      http.get("http://localhost:4010/owner", () =>
        HttpResponse.json({ code: "owner_not_found", message: "Владелец не найден" }, { status: 404 })
      )
    );
    await expect(getOwner()).rejects.toMatchObject({ code: "owner_not_found" });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/format.test.ts src/lib/api/owner.test.ts
```
Expected: FAIL — `./format` and `./owner` modules don't exist yet.

- [ ] **Step 3: Implement `format.ts`**

`frontend/src/lib/format.ts`:
```ts
import type { Slot } from "./api/types";

export function formatInTimeZone(
  iso: string,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("ru-RU", { timeZone, ...options }).format(new Date(iso));
}

function dayKeyInTimeZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function groupSlotsByDay(
  slots: Slot[],
  timeZone: string
): Array<{ day: string; slots: Slot[] }> {
  const groups = new Map<string, Slot[]>();
  for (const slot of slots) {
    const key = dayKeyInTimeZone(slot.start, timeZone);
    const bucket = groups.get(key) ?? [];
    bucket.push(slot);
    groups.set(key, bucket);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, daySlots]) => ({ day, slots: daySlots }));
}
```

- [ ] **Step 4: Implement `api/owner.ts`**

`frontend/src/lib/api/owner.ts`:
```ts
import { apiRequest } from "./client";
import type { Owner } from "./types";

export function getOwner(): Promise<Owner> {
  return apiRequest<{ owner: Owner }>("/owner").then((res) => res.owner);
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/lib/format.test.ts src/lib/api/owner.test.ts
```
Expected: PASS (4 tests).

- [ ] **Step 6: Implement the `useOwner` hook**

`frontend/src/hooks/useOwner.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import { getOwner } from "@/lib/api/owner";

export function useOwner() {
  return useQuery({ queryKey: ["owner"], queryFn: getOwner });
}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib frontend/src/hooks
git commit -m "Add owner API, timezone formatting utilities, and useOwner hook"
```

---

### Task 5: Event Types API and hooks

**Files:**
- Create: `frontend/src/lib/api/eventTypes.ts`
- Create: `frontend/src/hooks/useEventTypes.ts`
- Test: `frontend/src/lib/api/eventTypes.test.ts`

**Interfaces:**
- Consumes: `apiRequest`, `ApiError` from `@/lib/api/client`; `EventType`, `CreateEventTypeRequest` from `@/lib/api/types`.
- Produces: `listEventTypes()`, `getEventType(id)`, `createEventType(input)` from `@/lib/api/eventTypes`; `useEventTypes()`, `useEventType(id)`, `useCreateEventType()` from `@/hooks/useEventTypes` — used by Tasks 9, 10, 14.

- [ ] **Step 1: Write the failing tests**

`frontend/src/lib/api/eventTypes.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { eventTypesFixture } from "@/test/handlers";
import { createEventType, getEventType, listEventTypes } from "./eventTypes";
import { ApiError } from "./client";

describe("eventTypes API", () => {
  it("lists event types", async () => {
    const result = await listEventTypes();
    expect(result).toEqual(eventTypesFixture);
  });

  it("gets one event type by id", async () => {
    const result = await getEventType("intro-call");
    expect(result.name).toBe("Знакомство");
  });

  it("throws ApiError 404 for an unknown event type", async () => {
    await expect(getEventType("missing")).rejects.toBeInstanceOf(ApiError);
  });

  it("creates an event type", async () => {
    const created = await createEventType({
      id: "new-type",
      name: "Демо",
      description: "Демо-звонок",
      durationMinutes: 45,
    });
    expect(created.id).toBe("new-type");
  });

  it("throws ApiError 409 when the id already exists", async () => {
    await expect(
      createEventType({
        id: "intro-call",
        name: "Дубликат",
        description: "",
        durationMinutes: 15,
      })
    ).rejects.toMatchObject({ status: 409 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/lib/api/eventTypes.test.ts
```
Expected: FAIL — `./eventTypes` module doesn't exist.

- [ ] **Step 3: Implement `api/eventTypes.ts`**

`frontend/src/lib/api/eventTypes.ts`:
```ts
import { apiRequest } from "./client";
import type { CreateEventTypeRequest, EventType } from "./types";

export function listEventTypes(): Promise<EventType[]> {
  return apiRequest<{ eventTypes: EventType[] }>("/event-types").then((res) => res.eventTypes);
}

export function getEventType(eventTypeId: string): Promise<EventType> {
  return apiRequest<{ eventType: EventType }>(`/event-types/${eventTypeId}`).then(
    (res) => res.eventType
  );
}

export function createEventType(input: CreateEventTypeRequest): Promise<EventType> {
  return apiRequest<{ created: EventType }>("/event-types", {
    method: "POST",
    body: input,
  }).then((res) => res.created);
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/lib/api/eventTypes.test.ts
```
Expected: PASS (5 tests).

- [ ] **Step 5: Implement the hooks**

`frontend/src/hooks/useEventTypes.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEventType, getEventType, listEventTypes } from "@/lib/api/eventTypes";
import type { CreateEventTypeRequest } from "@/lib/api/types";

export function useEventTypes() {
  return useQuery({ queryKey: ["event-types"], queryFn: listEventTypes });
}

export function useEventType(eventTypeId: string) {
  return useQuery({
    queryKey: ["event-types", eventTypeId],
    queryFn: () => getEventType(eventTypeId),
  });
}

export function useCreateEventType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventTypeRequest) => createEventType(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-types"] });
    },
  });
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/api/eventTypes.ts frontend/src/lib/api/eventTypes.test.ts frontend/src/hooks/useEventTypes.ts
git commit -m "Add event types API and hooks"
```

---

### Task 6: Slots API, hook, and calendar component

**Files:**
- Create: `frontend/src/lib/api/slots.ts`
- Create: `frontend/src/hooks/useSlots.ts`
- Create: `frontend/src/components/slots/SlotsCalendar.tsx`
- Test: `frontend/src/lib/api/slots.test.ts`

**Interfaces:**
- Consumes: `apiRequest` from `@/lib/api/client`; `Slot` from `@/lib/api/types`; `groupSlotsByDay`, `formatInTimeZone` from `@/lib/format` (Task 4).
- Produces: `listAvailableSlots(eventTypeId)` from `@/lib/api/slots`; `useSlots(eventTypeId)` from `@/hooks/useSlots`; `<SlotsCalendar slots timeZone onSelect />` from `@/components/slots/SlotsCalendar` — used by Task 10.

- [ ] **Step 1: Write the failing test**

`frontend/src/lib/api/slots.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { slotsFixture } from "@/test/handlers";
import { ApiError } from "./client";
import { listAvailableSlots } from "./slots";

describe("listAvailableSlots", () => {
  it("lists available slots for an event type", async () => {
    const result = await listAvailableSlots("intro-call");
    expect(result).toEqual(slotsFixture);
  });

  it("throws ApiError 404 for an unknown event type", async () => {
    await expect(listAvailableSlots("missing")).rejects.toBeInstanceOf(ApiError);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/lib/api/slots.test.ts
```
Expected: FAIL — `./slots` module doesn't exist.

- [ ] **Step 3: Implement `api/slots.ts`**

`frontend/src/lib/api/slots.ts`:
```ts
import { apiRequest } from "./client";
import type { Slot } from "./types";

export function listAvailableSlots(eventTypeId: string): Promise<Slot[]> {
  return apiRequest<{ slots: Slot[] }>(`/event-types/${eventTypeId}/slots`).then(
    (res) => res.slots
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/lib/api/slots.test.ts
```
Expected: PASS (2 tests).

- [ ] **Step 5: Implement the `useSlots` hook**

`frontend/src/hooks/useSlots.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import { listAvailableSlots } from "@/lib/api/slots";

export function useSlots(eventTypeId: string) {
  return useQuery({
    queryKey: ["event-types", eventTypeId, "slots"],
    queryFn: () => listAvailableSlots(eventTypeId),
  });
}
```

- [ ] **Step 6: Implement `SlotsCalendar`**

`frontend/src/components/slots/SlotsCalendar.tsx`:
```tsx
import { Button } from "@/components/ui/button";
import { formatInTimeZone, groupSlotsByDay } from "@/lib/format";
import type { Slot } from "@/lib/api/types";

interface SlotsCalendarProps {
  slots: Slot[];
  timeZone: string;
  onSelect: (slot: Slot) => void;
}

export function SlotsCalendar({ slots, timeZone, onSelect }: SlotsCalendarProps) {
  const groups = groupSlotsByDay(slots, timeZone);

  if (groups.length === 0) {
    return <p className="text-muted-foreground">Нет свободных слотов на ближайшие 14 дней.</p>;
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.day}>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            {formatInTimeZone(group.slots[0].start, timeZone, {
              day: "2-digit",
              month: "long",
              weekday: "short",
            })}
          </h3>
          <div className="flex flex-wrap gap-2">
            {group.slots.map((slot) => (
              <Button key={slot.start} variant="outline" size="sm" onClick={() => onSelect(slot)}>
                {formatInTimeZone(slot.start, timeZone, { hour: "2-digit", minute: "2-digit" })}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/api/slots.ts frontend/src/lib/api/slots.test.ts frontend/src/hooks/useSlots.ts frontend/src/components/slots
git commit -m "Add slots API, hook, and SlotsCalendar component"
```

---

### Task 7: Bookings API and hooks

**Files:**
- Create: `frontend/src/lib/api/bookings.ts`
- Create: `frontend/src/hooks/useBookings.ts`
- Test: `frontend/src/lib/api/bookings.test.ts`

**Interfaces:**
- Consumes: `apiRequest` from `@/lib/api/client`; `Booking`, `CreateBookingRequest` from `@/lib/api/types`.
- Produces: `createBooking(input)`, `listBookings(from?)`, `getBooking(id)` from `@/lib/api/bookings`; `useOwnerBookings()`, `useBooking(id)`, `useCreateBooking(eventTypeId)` from `@/hooks/useBookings` — used by Tasks 11, 12, 13.

- [ ] **Step 1: Write the failing test**

`frontend/src/lib/api/bookings.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { bookingFixture } from "@/test/handlers";
import { ApiError } from "./client";
import { createBooking, getBooking, listBookings } from "./bookings";

describe("bookings API", () => {
  it("creates a booking", async () => {
    const created = await createBooking({
      eventTypeId: "intro-call",
      start: "2026-07-10T09:00:00Z",
      guestName: "Иван Гость",
      guestEmail: "ivan@example.com",
    });
    expect(created).toEqual(bookingFixture);
  });

  it("propagates a 409 when the slot is already taken", async () => {
    server.use(
      http.post("http://localhost:4010/bookings", () =>
        HttpResponse.json({ code: "slot_taken", message: "Время уже занято" }, { status: 409 })
      )
    );
    await expect(
      createBooking({
        eventTypeId: "intro-call",
        start: "2026-07-10T09:00:00Z",
        guestName: "Иван",
        guestEmail: "ivan@example.com",
      })
    ).rejects.toMatchObject({ status: 409, code: "slot_taken" });
  });

  it("lists owner bookings", async () => {
    const result = await listBookings();
    expect(result).toEqual([bookingFixture]);
  });

  it("gets one booking by id", async () => {
    const result = await getBooking(bookingFixture.id);
    expect(result).toEqual(bookingFixture);
  });

  it("throws ApiError 404 for an unknown booking id", async () => {
    await expect(getBooking("missing")).rejects.toBeInstanceOf(ApiError);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/lib/api/bookings.test.ts
```
Expected: FAIL — `./bookings` module doesn't exist.

- [ ] **Step 3: Implement `api/bookings.ts`**

`frontend/src/lib/api/bookings.ts`:
```ts
import { apiRequest } from "./client";
import type { Booking, CreateBookingRequest } from "./types";

export function createBooking(input: CreateBookingRequest): Promise<Booking> {
  return apiRequest<{ created: Booking }>("/bookings", {
    method: "POST",
    body: input,
  }).then((res) => res.created);
}

export function listBookings(from?: string): Promise<Booking[]> {
  return apiRequest<{ bookings: Booking[] }>("/bookings", {
    searchParams: { from },
  }).then((res) => res.bookings);
}

export function getBooking(bookingId: string): Promise<Booking> {
  return apiRequest<{ booking: Booking }>(`/bookings/${bookingId}`).then((res) => res.booking);
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/lib/api/bookings.test.ts
```
Expected: PASS (5 tests).

- [ ] **Step 5: Implement the hooks**

`frontend/src/hooks/useBookings.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBooking, getBooking, listBookings } from "@/lib/api/bookings";
import type { CreateBookingRequest } from "@/lib/api/types";

export function useOwnerBookings() {
  return useQuery({ queryKey: ["bookings"], queryFn: () => listBookings() });
}

export function useBooking(bookingId: string) {
  return useQuery({ queryKey: ["bookings", bookingId], queryFn: () => getBooking(bookingId) });
}

export function useCreateBooking(eventTypeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookingRequest) => createBooking(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["event-types", eventTypeId, "slots"] });
    },
  });
}
```

`onSettled` (not `onSuccess`) drives the slots refetch so it also runs on a `409` conflict — the slot the guest tried to take may have just been taken by someone else and must disappear from the list.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/api/bookings.ts frontend/src/lib/api/bookings.test.ts frontend/src/hooks/useBookings.ts
git commit -m "Add bookings API and hooks"
```

---

### Task 8: App shell — routing, layout, toaster

**Files:**
- Create: `frontend/src/components/layout/AppLayout.tsx`
- Create: `frontend/src/App.tsx` (replaces Vite's default)
- Modify: `frontend/src/main.tsx`
- Create: `frontend/src/pages/EventTypesPage.tsx` (temporary placeholder body, filled in by Task 9)
- Create: `frontend/src/pages/EventTypeDetailPage.tsx` (placeholder, filled in by Task 10)
- Create: `frontend/src/pages/BookingConfirmationPage.tsx` (placeholder, filled in by Task 12)
- Create: `frontend/src/pages/OwnerBookingsPage.tsx` (placeholder, filled in by Task 13)
- Create: `frontend/src/pages/OwnerEventTypesPage.tsx` (placeholder, filled in by Task 14)
- Test: `frontend/src/App.test.tsx`

**Interfaces:**
- Consumes: shadcn `Toaster` from `@/components/ui/sonner` (Task 1).
- Produces: routes `/`, `/event-types/:eventTypeId`, `/bookings/:bookingId`, `/owner`, `/owner/event-types`, each rendering the page component of the matching name from `@/pages/*` — Tasks 9–14 fill in the real page bodies without touching `App.tsx` again.

Placeholder pages here render a heading only — this task's job is proving the shell (layout, routing, providers) works, not the page content. Each placeholder is replaced wholesale (not appended to) in its owning task.

- [ ] **Step 1: Write the failing smoke test**

`frontend/src/App.test.tsx`:
```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("renders the header with navigation to both sections", () => {
    render(<App />);
    expect(screen.getByText("Календарь бронирования")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Каталог" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Кабинет владельца" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/App.test.tsx
```
Expected: FAIL — `App` doesn't export the layout yet (default Vite starter content).

- [ ] **Step 3: Implement `AppLayout`**

`frontend/src/components/layout/AppLayout.tsx`:
```tsx
import { NavLink, Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold">Календарь бронирования</span>
          <nav className="flex gap-4 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? "font-medium text-primary" : "text-muted-foreground"
              }
            >
              Каталог
            </NavLink>
            <NavLink
              to="/owner"
              className={({ isActive }) =>
                isActive ? "font-medium text-primary" : "text-muted-foreground"
              }
            >
              Кабинет владельца
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Create placeholder pages**

`frontend/src/pages/EventTypesPage.tsx`:
```tsx
export function EventTypesPage() {
  return <h1 className="text-xl font-semibold">Каталог типов событий</h1>;
}
```

`frontend/src/pages/EventTypeDetailPage.tsx`:
```tsx
export function EventTypeDetailPage() {
  return <h1 className="text-xl font-semibold">Тип события</h1>;
}
```

`frontend/src/pages/BookingConfirmationPage.tsx`:
```tsx
export function BookingConfirmationPage() {
  return <h1 className="text-xl font-semibold">Подтверждение брони</h1>;
}
```

`frontend/src/pages/OwnerBookingsPage.tsx`:
```tsx
export function OwnerBookingsPage() {
  return <h1 className="text-xl font-semibold">Предстоящие встречи</h1>;
}
```

`frontend/src/pages/OwnerEventTypesPage.tsx`:
```tsx
export function OwnerEventTypesPage() {
  return <h1 className="text-xl font-semibold">Типы событий</h1>;
}
```

- [ ] **Step 5: Implement `App.tsx`**

`frontend/src/App.tsx`:
```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { EventTypesPage } from "@/pages/EventTypesPage";
import { EventTypeDetailPage } from "@/pages/EventTypeDetailPage";
import { BookingConfirmationPage } from "@/pages/BookingConfirmationPage";
import { OwnerBookingsPage } from "@/pages/OwnerBookingsPage";
import { OwnerEventTypesPage } from "@/pages/OwnerEventTypesPage";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<EventTypesPage />} />
            <Route path="/event-types/:eventTypeId" element={<EventTypeDetailPage />} />
            <Route path="/bookings/:bookingId" element={<BookingConfirmationPage />} />
            <Route path="/owner" element={<OwnerBookingsPage />} />
            <Route path="/owner/event-types" element={<OwnerEventTypesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 6: Update `main.tsx`**

`frontend/src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 7: Run the test to verify it passes**

```bash
npx vitest run src/App.test.tsx
```
Expected: PASS (1 test).

- [ ] **Step 8: Commit**

```bash
git add frontend/src/App.tsx frontend/src/App.test.tsx frontend/src/main.tsx frontend/src/components/layout frontend/src/pages
git commit -m "Add app shell: routing, layout, and placeholder pages"
```

---

### Task 9: Guest home page — event types catalog

**Files:**
- Modify: `frontend/src/pages/EventTypesPage.tsx` (replace placeholder body)
- Test: `frontend/src/pages/EventTypesPage.test.tsx`

**Interfaces:**
- Consumes: `useEventTypes()` from `@/hooks/useEventTypes` (Task 5); `renderWithProviders` from `@/test/render` (Task 2); `eventTypesFixture` from `@/test/handlers` (Task 2).
- Produces: no new exports consumed elsewhere — this is a leaf page reached via the `/` route already wired in Task 8.

- [ ] **Step 1: Write the failing test**

`frontend/src/pages/EventTypesPage.test.tsx`:
```tsx
import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/render";
import { eventTypesFixture } from "@/test/handlers";
import { EventTypesPage } from "./EventTypesPage";

describe("EventTypesPage", () => {
  it("renders each event type as a link to its detail page", async () => {
    renderWithProviders(<EventTypesPage />);

    await waitFor(() => {
      expect(screen.getByText(eventTypesFixture[0].name)).toBeInTheDocument();
    });

    const link = screen.getByRole("link", { name: new RegExp(eventTypesFixture[0].name) });
    expect(link).toHaveAttribute("href", `/event-types/${eventTypesFixture[0].id}`);
  });

  it("shows an empty state when there are no event types", async () => {
    server.use(
      http.get("http://localhost:4010/event-types", () => HttpResponse.json({ eventTypes: [] }))
    );
    renderWithProviders(<EventTypesPage />);

    await waitFor(() => {
      expect(screen.getByText("Пока нет доступных типов событий.")).toBeInTheDocument();
    });
  });

  it("shows an error state when the request fails", async () => {
    server.use(
      http.get("http://localhost:4010/event-types", () =>
        HttpResponse.json({ code: "server_error", message: "Ошибка" }, { status: 500 })
      )
    );
    renderWithProviders(<EventTypesPage />);

    await waitFor(() => {
      expect(screen.getByText("Не удалось загрузить типы событий.")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/pages/EventTypesPage.test.tsx
```
Expected: FAIL — placeholder page has no link, no empty/error states.

- [ ] **Step 3: Implement the page**

`frontend/src/pages/EventTypesPage.tsx`:
```tsx
import { Link } from "react-router-dom";
import { useEventTypes } from "@/hooks/useEventTypes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function EventTypesPage() {
  const { data: eventTypes, isLoading, isError } = useEventTypes();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-destructive">Не удалось загрузить типы событий.</p>;
  }

  if (!eventTypes || eventTypes.length === 0) {
    return <p className="text-muted-foreground">Пока нет доступных типов событий.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {eventTypes.map((eventType) => (
        <Link key={eventType.id} to={`/event-types/${eventType.id}`}>
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle>{eventType.name}</CardTitle>
              <CardDescription>{eventType.description}</CardDescription>
            </CardHeader>
            <CardContent>{eventType.durationMinutes} мин</CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/pages/EventTypesPage.test.tsx
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/EventTypesPage.tsx frontend/src/pages/EventTypesPage.test.tsx
git commit -m "Implement guest event types catalog page"
```

---

### Task 10: Event type detail page with slots calendar

**Files:**
- Modify: `frontend/src/pages/EventTypeDetailPage.tsx` (replace placeholder body)
- Test: `frontend/src/pages/EventTypeDetailPage.test.tsx`

**Interfaces:**
- Consumes: `useEventType(id)` from `@/hooks/useEventTypes` (Task 5); `useSlots(id)` from `@/hooks/useSlots` (Task 6); `useOwner()` from `@/hooks/useOwner` (Task 4); `<SlotsCalendar />` from `@/components/slots/SlotsCalendar` (Task 6).
- Produces: a `selectedSlot` state slot to be consumed by the `BookingDialog` wired in Task 11 (this task renders the page without the dialog; Task 11 adds it in-place).

- [ ] **Step 1: Write the failing test**

`frontend/src/pages/EventTypeDetailPage.test.tsx`:
```tsx
import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/render";
import { eventTypesFixture } from "@/test/handlers";
import { EventTypeDetailPage } from "./EventTypeDetailPage";

describe("EventTypeDetailPage", () => {
  it("shows the event type info and grouped available slot times", async () => {
    renderWithProviders(<EventTypeDetailPage />, {
      route: `/event-types/${eventTypesFixture[0].id}`,
      path: "/event-types/:eventTypeId",
    });

    await waitFor(() => {
      expect(screen.getByText(eventTypesFixture[0].name)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "12:00" })).toBeInTheDocument(); // 09:00Z in Europe/Moscow
  });

  it("shows a not-found message for an unknown event type", async () => {
    renderWithProviders(<EventTypeDetailPage />, {
      route: "/event-types/missing",
      path: "/event-types/:eventTypeId",
    });

    await waitFor(() => {
      expect(screen.getByText(/не найден/)).toBeInTheDocument();
    });
  });

  it("shows an empty state when there are no available slots", async () => {
    server.use(
      http.get("http://localhost:4010/event-types/:eventTypeId/slots", () =>
        HttpResponse.json({ slots: [] })
      )
    );
    renderWithProviders(<EventTypeDetailPage />, {
      route: `/event-types/${eventTypesFixture[0].id}`,
      path: "/event-types/:eventTypeId",
    });

    await waitFor(() => {
      expect(screen.getByText("Нет свободных слотов на ближайшие 14 дней.")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/pages/EventTypeDetailPage.test.tsx
```
Expected: FAIL — placeholder page ignores the route param and fetches nothing.

- [ ] **Step 3: Implement the page**

`frontend/src/pages/EventTypeDetailPage.tsx`:
```tsx
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useEventType } from "@/hooks/useEventTypes";
import { useSlots } from "@/hooks/useSlots";
import { useOwner } from "@/hooks/useOwner";
import { SlotsCalendar } from "@/components/slots/SlotsCalendar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Slot } from "@/lib/api/types";

export function EventTypeDetailPage() {
  const { eventTypeId } = useParams<{ eventTypeId: string }>();
  const id = eventTypeId!;
  const eventTypeQuery = useEventType(id);
  const slotsQuery = useSlots(id);
  const ownerQuery = useOwner();
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  if (eventTypeQuery.isLoading || ownerQuery.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (eventTypeQuery.isError || !eventTypeQuery.data) {
    return (
      <p className="text-destructive">
        Тип события не найден.{" "}
        <Link to="/" className="underline">
          Вернуться в каталог
        </Link>
      </p>
    );
  }

  const eventType = eventTypeQuery.data;
  const timeZone = ownerQuery.data?.timeZone ?? "UTC";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{eventType.name}</h1>
        <p className="text-muted-foreground">{eventType.description}</p>
        <p className="text-sm text-muted-foreground">{eventType.durationMinutes} мин</p>
      </div>

      {slotsQuery.isLoading && <Skeleton className="h-24 w-full" />}
      {slotsQuery.isError && <p className="text-destructive">Не удалось загрузить слоты.</p>}
      {slotsQuery.data && (
        <SlotsCalendar slots={slotsQuery.data} timeZone={timeZone} onSelect={setSelectedSlot} />
      )}

      {selectedSlot && (
        <p className="text-sm text-muted-foreground" data-testid="selected-slot">
          Выбран слот: {selectedSlot.start}
        </p>
      )}
    </div>
  );
}
```

Note: `selectedSlot` is surfaced via a `data-testid` paragraph for now; Task 11 replaces that paragraph with `<BookingDialog />`, wiring the same `selectedSlot`/`setSelectedSlot` pair into the dialog's `slot`/`onClose` props.

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/pages/EventTypeDetailPage.test.tsx
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/EventTypeDetailPage.tsx frontend/src/pages/EventTypeDetailPage.test.tsx
git commit -m "Implement event type detail page with slots calendar"
```

---

### Task 11: Booking dialog (form) and wiring into the detail page

**Files:**
- Create: `frontend/src/components/bookings/BookingDialog.tsx`
- Modify: `frontend/src/pages/EventTypeDetailPage.tsx` (swap the `data-testid` paragraph for `<BookingDialog />`)
- Test: `frontend/src/components/bookings/BookingDialog.test.tsx`

**Interfaces:**
- Consumes: `useCreateBooking(eventTypeId)` from `@/hooks/useBookings` (Task 7); `ApiError` from `@/lib/api/client` (Task 2); `Slot` from `@/lib/api/types`.
- Produces: `<BookingDialog eventTypeId slot onClose />` — on successful submit it navigates to `/bookings/:id` (consumed by Task 12's route).

- [ ] **Step 1: Write the failing test**

`frontend/src/components/bookings/BookingDialog.test.tsx`:
```tsx
import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/render";
import { BookingDialog } from "./BookingDialog";

const slot = { start: "2026-07-10T09:00:00Z", end: "2026-07-10T09:30:00Z" };

describe("BookingDialog", () => {
  it("shows validation errors for empty name and invalid email", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingDialog eventTypeId="intro-call" slot={slot} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Подтвердить запись" }));

    expect(await screen.findByText("Укажите имя")).toBeInTheDocument();
    expect(await screen.findByText("Некорректный email")).toBeInTheDocument();
  });

  it("submits the booking and navigates to the confirmation page on success", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<BookingDialog eventTypeId="intro-call" slot={slot} onClose={onClose} />);

    await user.type(screen.getByLabelText("Имя"), "Иван Гость");
    await user.type(screen.getByLabelText("Email"), "ivan@example.com");
    await user.click(screen.getByRole("button", { name: "Подтвердить запись" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows a toast when the slot is already taken (409)", async () => {
    server.use(
      http.post("http://localhost:4010/bookings", () =>
        HttpResponse.json({ code: "slot_taken", message: "Время уже занято" }, { status: 409 })
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<BookingDialog eventTypeId="intro-call" slot={slot} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("Имя"), "Иван Гость");
    await user.type(screen.getByLabelText("Email"), "ivan@example.com");
    await user.click(screen.getByRole("button", { name: "Подтвердить запись" }));

    expect(await screen.findByText("Время уже занято")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/bookings/BookingDialog.test.tsx
```
Expected: FAIL — `BookingDialog` module doesn't exist.

- [ ] **Step 3: Implement `BookingDialog`**

`frontend/src/components/bookings/BookingDialog.tsx`:
```tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateBooking } from "@/hooks/useBookings";
import { ApiError } from "@/lib/api/client";
import type { Slot } from "@/lib/api/types";

const bookingSchema = z.object({
  guestName: z.string().min(1, "Укажите имя"),
  guestEmail: z.string().email("Некорректный email"),
  note: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingDialogProps {
  eventTypeId: string;
  slot: Slot | null;
  onClose: () => void;
}

export function BookingDialog({ eventTypeId, slot, onClose }: BookingDialogProps) {
  const navigate = useNavigate();
  const createBooking = useCreateBooking(eventTypeId);
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { guestName: "", guestEmail: "", note: "" },
  });

  useEffect(() => {
    if (slot) form.reset({ guestName: "", guestEmail: "", note: "" });
  }, [slot, form]);

  if (!slot) return null;

  const onSubmit = (values: BookingFormValues) => {
    createBooking.mutate(
      { eventTypeId, start: slot.start, ...values },
      {
        onSuccess: (booking) => {
          onClose();
          navigate(`/bookings/${booking.id}`);
        },
        onError: (error) => {
          const message = error instanceof ApiError ? error.message : "Не удалось создать бронь";
          toast.error(message);
        },
      }
    );
  };

  return (
    <Dialog open={Boolean(slot)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Подтверждение записи</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="guestName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guestEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Заметка (необязательно)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={createBooking.isPending} className="w-full">
              Подтвердить запись
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/components/bookings/BookingDialog.test.tsx
```
Expected: PASS (3 tests).

- [ ] **Step 5: Wire the dialog into the detail page**

In `frontend/src/pages/EventTypeDetailPage.tsx`, replace:
```tsx
      {selectedSlot && (
        <p className="text-sm text-muted-foreground" data-testid="selected-slot">
          Выбран слот: {selectedSlot.start}
        </p>
      )}
```
with:
```tsx
      <BookingDialog eventTypeId={id} slot={selectedSlot} onClose={() => setSelectedSlot(null)} />
```
and add the import:
```tsx
import { BookingDialog } from "@/components/bookings/BookingDialog";
```

- [ ] **Step 6: Re-run the detail page test to confirm no regression**

```bash
npx vitest run src/pages/EventTypeDetailPage.test.tsx
```
Expected: PASS (3 tests, unchanged).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/bookings frontend/src/pages/EventTypeDetailPage.tsx
git commit -m "Add booking dialog with validation and wire it into the detail page"
```

---

### Task 12: Booking confirmation page

**Files:**
- Modify: `frontend/src/pages/BookingConfirmationPage.tsx` (replace placeholder body)
- Test: `frontend/src/pages/BookingConfirmationPage.test.tsx`

**Interfaces:**
- Consumes: `useBooking(id)` from `@/hooks/useBookings` (Task 7); `useOwner()` from `@/hooks/useOwner` (Task 4); `formatInTimeZone` from `@/lib/format` (Task 4).

- [ ] **Step 1: Write the failing test**

`frontend/src/pages/BookingConfirmationPage.test.tsx`:
```tsx
import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import { bookingFixture } from "@/test/handlers";
import { BookingConfirmationPage } from "./BookingConfirmationPage";

describe("BookingConfirmationPage", () => {
  it("shows the booking's event type name and guest info", async () => {
    renderWithProviders(<BookingConfirmationPage />, {
      route: `/bookings/${bookingFixture.id}`,
      path: "/bookings/:bookingId",
    });

    await waitFor(() => {
      expect(screen.getByText(bookingFixture.eventTypeName)).toBeInTheDocument();
    });
    expect(screen.getByText(new RegExp(bookingFixture.guestName))).toBeInTheDocument();
  });

  it("shows a not-found message for an unknown booking", async () => {
    renderWithProviders(<BookingConfirmationPage />, {
      route: "/bookings/missing",
      path: "/bookings/:bookingId",
    });

    await waitFor(() => {
      expect(screen.getByText(/не найдено/)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/pages/BookingConfirmationPage.test.tsx
```
Expected: FAIL — placeholder page ignores the route param.

- [ ] **Step 3: Implement the page**

`frontend/src/pages/BookingConfirmationPage.tsx`:
```tsx
import { Link, useParams } from "react-router-dom";
import { useBooking } from "@/hooks/useBookings";
import { useOwner } from "@/hooks/useOwner";
import { formatInTimeZone } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BookingConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const bookingQuery = useBooking(bookingId!);
  const ownerQuery = useOwner();

  if (bookingQuery.isLoading || ownerQuery.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (bookingQuery.isError || !bookingQuery.data) {
    return (
      <p className="text-destructive">
        Бронирование не найдено.{" "}
        <Link to="/" className="underline">
          Вернуться в каталог
        </Link>
      </p>
    );
  }

  const booking = bookingQuery.data;
  const timeZone = ownerQuery.data?.timeZone ?? "UTC";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Бронь подтверждена</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p>{booking.eventTypeName}</p>
        <p>{formatInTimeZone(booking.start, timeZone, { dateStyle: "full", timeStyle: "short" })}</p>
        <p className="text-muted-foreground">
          Гость: {booking.guestName} ({booking.guestEmail})
        </p>
        {booking.note && <p className="text-muted-foreground">Заметка: {booking.note}</p>}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/pages/BookingConfirmationPage.test.tsx
```
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/BookingConfirmationPage.tsx frontend/src/pages/BookingConfirmationPage.test.tsx
git commit -m "Implement booking confirmation page"
```

---

### Task 13: Owner bookings page

**Files:**
- Modify: `frontend/src/pages/OwnerBookingsPage.tsx` (replace placeholder body)
- Test: `frontend/src/pages/OwnerBookingsPage.test.tsx`

**Interfaces:**
- Consumes: `useOwnerBookings()` from `@/hooks/useBookings` (Task 7); `useOwner()` from `@/hooks/useOwner` (Task 4); `formatInTimeZone` from `@/lib/format` (Task 4); shadcn `Table` primitives (Task 1).

- [ ] **Step 1: Write the failing test**

`frontend/src/pages/OwnerBookingsPage.test.tsx`:
```tsx
import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/render";
import { bookingFixture } from "@/test/handlers";
import { OwnerBookingsPage } from "./OwnerBookingsPage";

describe("OwnerBookingsPage", () => {
  it("lists upcoming bookings with event type and guest name", async () => {
    renderWithProviders(<OwnerBookingsPage />);

    await waitFor(() => {
      expect(screen.getByText(bookingFixture.eventTypeName)).toBeInTheDocument();
    });
    expect(screen.getByText(bookingFixture.guestName)).toBeInTheDocument();
  });

  it("shows an empty state when there are no bookings", async () => {
    server.use(
      http.get("http://localhost:4010/bookings", () => HttpResponse.json({ bookings: [] }))
    );
    renderWithProviders(<OwnerBookingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Предстоящих встреч нет.")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/pages/OwnerBookingsPage.test.tsx
```
Expected: FAIL — placeholder page renders only a heading.

- [ ] **Step 3: Implement the page**

`frontend/src/pages/OwnerBookingsPage.tsx`:
```tsx
import { useOwnerBookings } from "@/hooks/useBookings";
import { useOwner } from "@/hooks/useOwner";
import { formatInTimeZone } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function OwnerBookingsPage() {
  const bookingsQuery = useOwnerBookings();
  const ownerQuery = useOwner();

  if (bookingsQuery.isLoading || ownerQuery.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (bookingsQuery.isError) {
    return <p className="text-destructive">Не удалось загрузить встречи.</p>;
  }

  const bookings = bookingsQuery.data ?? [];
  const timeZone = ownerQuery.data?.timeZone ?? "UTC";

  if (bookings.length === 0) {
    return <p className="text-muted-foreground">Предстоящих встреч нет.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Когда</TableHead>
          <TableHead>Тип события</TableHead>
          <TableHead>Гость</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell>
              {formatInTimeZone(booking.start, timeZone, { dateStyle: "medium", timeStyle: "short" })}
            </TableCell>
            <TableCell>{booking.eventTypeName}</TableCell>
            <TableCell>{booking.guestName}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/pages/OwnerBookingsPage.test.tsx
```
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/OwnerBookingsPage.tsx frontend/src/pages/OwnerBookingsPage.test.tsx
git commit -m "Implement owner upcoming bookings page"
```

---

### Task 14: Owner event types page — list and create form

**Files:**
- Modify: `frontend/src/pages/OwnerEventTypesPage.tsx` (replace placeholder body)
- Test: `frontend/src/pages/OwnerEventTypesPage.test.tsx`

**Interfaces:**
- Consumes: `useEventTypes()`, `useCreateEventType()` from `@/hooks/useEventTypes` (Task 5); `ApiError` from `@/lib/api/client` (Task 2).

- [ ] **Step 1: Write the failing test**

`frontend/src/pages/OwnerEventTypesPage.test.tsx`:
```tsx
import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import { eventTypesFixture } from "@/test/handlers";
import { OwnerEventTypesPage } from "./OwnerEventTypesPage";

describe("OwnerEventTypesPage", () => {
  it("lists existing event types", async () => {
    renderWithProviders(<OwnerEventTypesPage />);
    await waitFor(() => {
      expect(screen.getByText(eventTypesFixture[0].name)).toBeInTheDocument();
    });
  });

  it("creates a new event type and shows a success toast", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OwnerEventTypesPage />);

    await user.type(screen.getByLabelText("Идентификатор"), "demo-call");
    await user.type(screen.getByLabelText("Название"), "Демо");
    await user.clear(screen.getByLabelText("Длительность (мин)"));
    await user.type(screen.getByLabelText("Длительность (мин)"), "45");
    await user.click(screen.getByRole("button", { name: "Создать" }));

    expect(await screen.findByText("Тип события создан")).toBeInTheDocument();
  });

  it("attaches a 409 conflict to the id field", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OwnerEventTypesPage />);

    await user.type(screen.getByLabelText("Идентификатор"), eventTypesFixture[0].id);
    await user.type(screen.getByLabelText("Название"), "Дубликат");
    await user.click(screen.getByRole("button", { name: "Создать" }));

    expect(
      await screen.findByText("Тип события с таким id уже существует")
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/pages/OwnerEventTypesPage.test.tsx
```
Expected: FAIL — placeholder page has no form or list.

- [ ] **Step 3: Implement the page**

`frontend/src/pages/OwnerEventTypesPage.tsx`:
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateEventType, useEventTypes } from "@/hooks/useEventTypes";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";

const eventTypeSchema = z.object({
  id: z.string().min(1, "Укажите идентификатор"),
  name: z.string().min(1, "Укажите название"),
  description: z.string(),
  durationMinutes: z.coerce.number().min(1, "Длительность должна быть больше 0"),
});

type EventTypeFormValues = z.infer<typeof eventTypeSchema>;

export function OwnerEventTypesPage() {
  const eventTypesQuery = useEventTypes();
  const createEventType = useCreateEventType();
  const form = useForm<EventTypeFormValues>({
    resolver: zodResolver(eventTypeSchema),
    defaultValues: { id: "", name: "", description: "", durationMinutes: 30 },
  });

  const onSubmit = (values: EventTypeFormValues) => {
    createEventType.mutate(values, {
      onSuccess: () => {
        toast.success("Тип события создан");
        form.reset({ id: "", name: "", description: "", durationMinutes: 30 });
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          form.setError("id", { message: error.message });
          return;
        }
        const message = error instanceof ApiError ? error.message : "Не удалось создать тип события";
        toast.error(message);
      },
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Новый тип события</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Идентификатор</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Длительность (мин)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={createEventType.isPending}>
                Создать
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Существующие типы</h2>
        {eventTypesQuery.isLoading && <Skeleton className="h-24 w-full" />}
        {eventTypesQuery.isError && (
          <p className="text-destructive">Не удалось загрузить типы событий.</p>
        )}
        {eventTypesQuery.data && eventTypesQuery.data.length === 0 && (
          <p className="text-muted-foreground">Типов событий пока нет.</p>
        )}
        {eventTypesQuery.data && eventTypesQuery.data.length > 0 && (
          <ul className="space-y-2">
            {eventTypesQuery.data.map((eventType) => (
              <li key={eventType.id} className="rounded border p-3">
                <span className="font-medium">{eventType.name}</span>{" "}
                <span className="text-muted-foreground">({eventType.durationMinutes} мин)</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/pages/OwnerEventTypesPage.test.tsx
```
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full test suite to confirm no regressions**

```bash
npx vitest run
```
Expected: all test files PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/OwnerEventTypesPage.tsx frontend/src/pages/OwnerEventTypesPage.test.tsx
git commit -m "Implement owner event types page with create form"
```

---

### Task 15: Manual end-to-end verification against Prism + frontend README

**Files:**
- Create: `frontend/README.md`

**Interfaces:**
- Consumes: root `npm run spec:compile` / `npm run mock` (Task 3); `frontend`'s `npm run dev` (Task 1).

- [ ] **Step 1: Write `frontend/README.md`**

```markdown
# Frontend — Календарь бронирования

React + TypeScript + shadcn/ui интерфейс поверх API-контракта из `../spec`.

## Разработка

Из корня репозитория, в одном терминале — поднять Prism-мок из контракта:

\`\`\`bash
npm install
npm run spec:compile
npm run mock
\`\`\`

В другом терминале — сам фронтенд:

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

Откройте адрес, который выведет Vite (обычно http://localhost:5173).

`VITE_API_BASE_URL` в `.env` задаёт адрес API (по умолчанию — Prism, `http://localhost:4010`).
Чтобы переключиться на настоящий бэкенд, поменяйте значение переменной.

## Тесты

\`\`\`bash
npm run test
\`\`\`
```

- [ ] **Step 2: Start Prism mock (repo root, background)**

```bash
npm run spec:compile
npm run mock &
```
Expected: Prism logs `Prism is listening on http://127.0.0.1:4010`.

- [ ] **Step 3: Start the frontend dev server (in `frontend/`, background)**

```bash
cd frontend
npm run dev &
```
Expected: Vite logs a local URL (e.g. `http://localhost:5173`).

- [ ] **Step 4: Walk the guest flow in a browser**

Open the Vite URL. Confirm:
- `/` shows at least one event type card (Prism generates one from the `EventType` schema example).
- Clicking a card navigates to `/event-types/:id` and shows slot buttons.
- Clicking a slot opens the booking dialog; submitting with a valid name/email navigates to `/bookings/:id` showing a confirmation card.
- Submitting with an invalid email shows the inline "Некорректный email" message and does not submit.

- [ ] **Step 5: Walk the owner flow in a browser**

Navigate to "Кабинет владельца":
- `/owner` shows a table (Prism-mocked bookings, so contents will be example data, not the booking just created — this is expected, see the design doc's mock limitation note).
- `/owner/event-types` shows the existing list and the create form; submitting a new `id`/`name`/`durationMinutes` shows the "Тип события создан" toast.

- [ ] **Step 6: Stop the background processes**

```bash
kill %1 %2
```
(or close the terminals running `npm run mock` and `npm run dev`)

- [ ] **Step 7: Commit**

```bash
git add frontend/README.md
git commit -m "Add frontend README with dev and test instructions"
```

---

## Self-Review Notes

- **Spec coverage:** every route in the design doc has a task (guest catalog → Task 9, detail+slots → Task 10, booking → Task 11, confirmation → Task 12, owner bookings → Task 13, owner event types → Task 14). Timezone display rule → Task 4 (`formatInTimeZone` using `Owner.timeZone`) used throughout Tasks 10, 12, 13. Error handling rules (404/409/422 + toasts) → Tasks 9–14 each cover their relevant status codes. Dev-without-backend requirement → Tasks 3 and 15.
- **Type consistency checked:** `Slot { start, end }`, `EventType { id, name, description, durationMinutes }`, `Booking { id, eventTypeId, eventTypeName, start, end, guestName, guestEmail, note?, createdAt }`, `CreateBookingRequest { eventTypeId, start, guestName, guestEmail, note? }`, `CreateEventTypeRequest { id, name, description, durationMinutes }` are defined once in Task 2 and reused verbatim by every later task's imports — no renames introduced.
- **Hook/function names checked:** `useOwner`, `useEventTypes`/`useEventType`/`useCreateEventType`, `useSlots`, `useOwnerBookings`/`useBooking`/`useCreateBooking`, `groupSlotsByDay`/`formatInTimeZone`, `apiRequest`/`ApiError` are each defined exactly once and referenced with the same name and signature everywhere they're consumed.
