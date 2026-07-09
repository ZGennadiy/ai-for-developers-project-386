import "@typespec/http";

using Http;

namespace BookingCalendar;

// ---------------------------------------------------------------------------
// Доменные модели
// ---------------------------------------------------------------------------

@doc("Владелец календаря — единственный, заранее заданный профиль.")
model Owner {
  @doc("Идентификатор владельца.")
  id: string;

  @doc("Имя владельца.")
  @minLength(1)
  name: string;

  @doc("Контактный email владельца.")
  @format("email")
  email: string;

  @doc("Часовой пояс владельца (IANA, напр. Europe/Moscow).")
  timeZone: string;
}

@doc("Тип события — шаблон встречи, который создаёт владелец.")
model EventType {
  @doc("Идентификатор типа события. Задаётся владельцем при создании.")
  id: string;

  @doc("Название типа события.")
  @minLength(1)
  name: string;

  @doc("Описание типа события.")
  description: string;

  @doc("Длительность встречи в минутах.")
  @minValue(1)
  durationMinutes: int32;
}

@doc("Свободный слот для записи. Длина слота равна длительности типа события.")
model Slot {
  @doc("Начало слота (ISO 8601, UTC).")
  start: utcDateTime;

  @doc("Конец слота: start + durationMinutes.")
  end: utcDateTime;
}

@doc("Бронирование — запись гостя на конкретный слот выбранного типа события. Модель ответа.")
model Booking {
  @doc("Идентификатор брони. Генерируется сервером.")
  id: string;

  @doc("Тип события, на который сделана запись.")
  eventTypeId: string;

  @doc("Название типа события (для списка встреч владельца).")
  eventTypeName: string;

  @doc("Начало встречи.")
  start: utcDateTime;

  @doc("Конец встречи: start + durationMinutes типа события.")
  end: utcDateTime;

  @doc("Имя гостя.")
  guestName: string;

  @doc("Email гостя.")
  guestEmail: string;

  @doc("Необязательная заметка от гостя.")
  note?: string;

  @doc("Момент создания брони.")
  createdAt: utcDateTime;
}

// ---------------------------------------------------------------------------
// Модели запросов
// ---------------------------------------------------------------------------

@doc("Тело запроса на создание бронирования (публичный сценарий гостя).")
model CreateBookingRequest {
  @doc("Идентификатор выбранного типа события.")
  eventTypeId: string;

  @doc("Начало выбранного свободного слота (ISO 8601, UTC).")
  start: utcDateTime;

  @doc("Имя гостя.")
  @minLength(1)
  guestName: string;

  @doc("Email гостя.")
  @format("email")
  guestEmail: string;

  @doc("Необязательная заметка от гостя.")
  note?: string;
}

// ---------------------------------------------------------------------------
// Ошибки
// ---------------------------------------------------------------------------

@error
@doc("Единый формат ошибки API.")
model ApiError {
  @doc("Машиночитаемый код ошибки, напр. event_type_not_found, slot_taken.")
  code: string;

  @doc("Человекочитаемое описание ошибки.")
  message: string;
}

@doc("404 — запрошенный ресурс не найден.")
model NotFoundError {
  @statusCode statusCode: 404;
  @body error: ApiError;
}

@doc("409 — конфликт: время уже занято либо тип события с таким id уже существует.")
model ConflictError {
  @statusCode statusCode: 409;
  @body error: ApiError;
}

@doc("422 — запрос корректен синтаксически, но нарушает правила (вне окна, невалидный слот).")
model UnprocessableError {
  @statusCode statusCode: 422;
  @body error: ApiError;
}
