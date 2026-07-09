import "@typespec/http";

import "./models.tsp";
import "./event-types.tsp";
import "./slots.tsp";
import "./bookings.tsp";
import "./owner.tsp";

using Http;

/**
 * Booking Calendar API
 *
 * Сервис бронирования встреч по типу Calendly. Две роли без авторизации:
 * владелец календаря (заранее заданный профиль) и гость (бронирует без аккаунта).
 *
 * Операции помечены тегами:
 *   - `owner`  — админская часть (создание типов событий, список встреч);
 *   - `public` — публичная часть для гостя (список типов, слоты, создание брони).
 */
@service(#{ title: "Booking Calendar API" })
@server("http://localhost:3000", "Локальный сервер разработки")
namespace BookingCalendar;
