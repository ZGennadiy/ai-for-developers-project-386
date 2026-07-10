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
