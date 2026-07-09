import "@typespec/http";

import "./models.tsp";

using Http;

namespace BookingCalendar;

@doc("""
  Профиль владельца календаря. Владелец — единственный, заранее заданный профиль,
  используется по умолчанию в админской части. Через API только читается.
  """)
@tag("owner")
@route("/owner")
@get
op getOwner(): {
  @statusCode statusCode: 200;
  @body owner: Owner;
};
