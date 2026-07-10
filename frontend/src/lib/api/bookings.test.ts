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
