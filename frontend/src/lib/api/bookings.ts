import { apiRequest } from "./client";
import type { Booking, CreateBookingRequest } from "./types";

export function createBooking(input: CreateBookingRequest): Promise<Booking> {
  return apiRequest<Booking>("/bookings", {
    method: "POST",
    body: input,
  });
}

export function listBookings(from?: string): Promise<Booking[]> {
  return apiRequest<Booking[]>("/bookings", {
    searchParams: { from },
  });
}

export function getBooking(bookingId: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}`);
}
