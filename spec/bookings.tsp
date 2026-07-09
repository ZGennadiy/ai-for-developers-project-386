import "@typespec/http";

import "./models.tsp";

using Http;

namespace BookingCalendar;

@doc("Операции с бронированиями: создание гостем и просмотр встреч владельцем.")
@route("/bookings")
interface Bookings {
  @doc("""
    Гость создаёт бронирование на выбранный свободный слот. Указывает имя и email.
    404 — тип события не найден.
    409 — время уже занято (глобальное правило: даже для другого типа события).
    422 — слот вне 14-дневного окна, в прошлом или не совпадает со свободным слотом.
    """)
  @tag("public")
  @post
  create(@body booking: CreateBookingRequest):
    | {
        @statusCode statusCode: 201;
        @body created: Booking;
      }
    | NotFoundError
    | ConflictError
    | UnprocessableError;

  @doc("""
    Страница предстоящих встреч владельца: единый список бронирований всех типов
    событий, отсортированный по времени начала. Параметр `from` (по умолчанию —
    текущий момент) задаёт нижнюю границу выборки.
    """)
  @tag("owner")
  @get
  list(@query from?: utcDateTime): {
    @statusCode statusCode: 200;
    @body bookings: Booking[];
  };

  @doc("Получить одно бронирование по идентификатору (подтверждение брони).")
  @tag("public")
  @get
  @route("/{bookingId}")
  read(@path bookingId: string):
    | {
        @statusCode statusCode: 200;
        @body booking: Booking;
      }
    | NotFoundError;
}
