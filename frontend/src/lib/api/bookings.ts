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
