export interface Owner {
  id: string;
  name: string;
  email: string;
  timeZone: string;
}

export interface EventType {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
}

export interface Slot {
  start: string;
  end: string;
}

export interface Booking {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  start: string;
  end: string;
  guestName: string;
  guestEmail: string;
  note?: string;
  createdAt: string;
}

export interface CreateBookingRequest {
  eventTypeId: string;
  start: string;
  guestName: string;
  guestEmail: string;
  note?: string;
}

export interface CreateEventTypeRequest {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
}
