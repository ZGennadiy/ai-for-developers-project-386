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
      http.get("http://localhost:4010/bookings", () => HttpResponse.json([]))
    );
    renderWithProviders(<OwnerBookingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Предстоящих встреч нет.")).toBeInTheDocument();
    });
  });
});
