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
