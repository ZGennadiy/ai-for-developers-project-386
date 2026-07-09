import "@typespec/http";

import "./models.tsp";

using Http;

namespace BookingCalendar;

@doc("Операции с типами событий: создание владельцем и публичный просмотр гостем.")
@route("/event-types")
interface EventTypes {
  @doc("""
    Владелец создаёт тип события. Идентификатор `id` задаёт сам владелец.
    409 — тип события с таким `id` уже существует.
    """)
  @tag("owner")
  @post
  create(@body eventType: EventType):
    | {
        @statusCode statusCode: 201;
        @body created: EventType;
      }
    | ConflictError
    | UnprocessableError;

  @doc("Публичный список типов событий (гость видит название, описание, длительность).")
  @tag("public")
  @get
  list(): {
    @statusCode statusCode: 200;
    @body eventTypes: EventType[];
  };

  @doc("Получить один тип события по идентификатору.")
  @tag("public")
  @get
  @route("/{eventTypeId}")
  read(@path eventTypeId: string):
    | {
        @statusCode statusCode: 200;
        @body eventType: EventType;
      }
    | NotFoundError;
}
