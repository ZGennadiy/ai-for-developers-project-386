import { apiRequest } from "./client";
import type { Slot } from "./types";

export function listAvailableSlots(eventTypeId: string): Promise<Slot[]> {
  return apiRequest<Slot[]>(`/event-types/${eventTypeId}/slots`);
}
