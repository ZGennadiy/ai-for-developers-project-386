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
      http.get("http://localhost:4010/event-types", () => HttpResponse.json([]))
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
