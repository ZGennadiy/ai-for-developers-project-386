import { http, HttpResponse } from "msw";

const BASE_URL = "http://localhost:4010";

export const ownerFixture = {
  id: "owner-1",
  name: "Алина Смирнова",
  email: "alina@example.com",
  timeZone: "Europe/Moscow",
};

export const eventTypesFixture = [
  {
    id: "intro-call",
    name: "Знакомство",
    description: "Короткий созвон на знакомство",
    durationMinutes: 30,
  },
];

export const slotsFixture = [
  { start: "2026-07-10T09:00:00Z", end: "2026-07-10T09:30:00Z" },
  { start: "2026-07-10T10:00:00Z", end: "2026-07-10T10:30:00Z" },
];

export const bookingFixture = {
  id: "booking-1",
  eventTypeId: "intro-call",
  eventTypeName: "Знакомство",
  start: "2026-07-10T09:00:00Z",
  end: "2026-07-10T09:30:00Z",
  guestName: "Иван Гость",
  guestEmail: "ivan@example.com",
  createdAt: "2026-07-09T12:00:00Z",
};

export const handlers = [
  http.get(`${BASE_URL}/owner`, () => HttpResponse.json({ owner: ownerFixture })),

  http.get(`${BASE_URL}/event-types`, () =>
    HttpResponse.json({ eventTypes: eventTypesFixture })
  ),

  http.get(`${BASE_URL}/event-types/:eventTypeId`, ({ params }) => {
    const eventType = eventTypesFixture.find((item) => item.id === params.eventTypeId);
    if (!eventType) {
      return HttpResponse.json(
        { code: "event_type_not_found", message: "Тип события не найден" },
        { status: 404 }
      );
    }
    return HttpResponse.json({ eventType });
  }),

  http.get(`${BASE_URL}/event-types/:eventTypeId/slots`, ({ params }) => {
    const eventType = eventTypesFixture.find((item) => item.id === params.eventTypeId);
    if (!eventType) {
      return HttpResponse.json(
        { code: "event_type_not_found", message: "Тип события не найден" },
        { status: 404 }
      );
    }
    return HttpResponse.json({ slots: slotsFixture });
  }),

  http.post(`${BASE_URL}/event-types`, async ({ request }) => {
    const body = (await request.json()) as { id: string };
    if (eventTypesFixture.some((item) => item.id === body.id)) {
      return HttpResponse.json(
        { code: "event_type_exists", message: "Тип события с таким id уже существует" },
        { status: 409 }
      );
    }
    return HttpResponse.json({ created: body }, { status: 201 });
  }),

  http.post(`${BASE_URL}/bookings`, () =>
    HttpResponse.json({ created: bookingFixture }, { status: 201 })
  ),

  http.get(`${BASE_URL}/bookings`, () =>
    HttpResponse.json({ bookings: [bookingFixture] })
  ),

  http.get(`${BASE_URL}/bookings/:bookingId`, ({ params }) => {
    if (params.bookingId !== bookingFixture.id) {
      return HttpResponse.json(
        { code: "booking_not_found", message: "Бронирование не найдено" },
        { status: 404 }
      );
    }
    return HttpResponse.json({ booking: bookingFixture });
  }),
];
