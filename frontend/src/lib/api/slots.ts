import { apiRequest } from "./client";
import type { Slot } from "./types";

export function listAvailableSlots(eventTypeId: string): Promise<Slot[]> {
  return apiRequest<{ slots: Slot[] }>(`/event-types/${eventTypeId}/slots`).then(
    (res) => res.slots
  );
}
