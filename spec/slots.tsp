import "@typespec/http";

import "./models.tsp";

using Http;

namespace BookingCalendar;

@doc("""
  Свободные слоты выбранного типа события на ближайшие 14 дней от текущей даты.
  Уже занятое время (любым бронированием, включая другие типы событий) исключается
  из выдачи. Длина каждого слота равна `durationMinutes` типа события.
  404 — тип события не найден.
  """)
@tag("public")
@route("/event-types/{eventTypeId}/slots")
@get
op listAvailableSlots(@path eventTypeId: string):
  | {
      @statusCode statusCode: 200;
      @body slots: Slot[];
    }
  | NotFoundError;
