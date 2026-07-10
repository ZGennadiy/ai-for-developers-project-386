import { apiRequest } from "./client";
import type { CreateEventTypeRequest, EventType } from "./types";

export function listEventTypes(): Promise<EventType[]> {
  return apiRequest<EventType[]>("/event-types");
}

export function getEventType(eventTypeId: string): Promise<EventType> {
  return apiRequest<EventType>(`/event-types/${eventTypeId}`);
}

export function createEventType(input: CreateEventTypeRequest): Promise<EventType> {
  return apiRequest<EventType>("/event-types", {
    method: "POST",
    body: input,
  });
}
