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
