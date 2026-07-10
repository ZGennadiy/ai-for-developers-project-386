import { apiRequest } from "./client";
import type { CreateEventTypeRequest, EventType } from "./types";

export function listEventTypes(): Promise<EventType[]> {
  return apiRequest<{ eventTypes: EventType[] }>("/event-types").then((res) => res.eventTypes);
}

export function getEventType(eventTypeId: string): Promise<EventType> {
  return apiRequest<{ eventType: EventType }>(`/event-types/${eventTypeId}`).then(
    (res) => res.eventType
  );
}

export function createEventType(input: CreateEventTypeRequest): Promise<EventType> {
  return apiRequest<{ created: EventType }>("/event-types", {
    method: "POST",
    body: input,
  }).then((res) => res.created);
}
