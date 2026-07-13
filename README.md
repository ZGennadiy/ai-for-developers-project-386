### Hexlet tests and linter status:
[![Actions Status](https://github.com/ZGennadiy/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/ZGennadiy/ai-for-developers-project-386/actions)

# Календарь бронирования

Проектирование сервиса бронирования встреч по типу Calendly. Две роли без авторизации:
**владелец календаря** (заранее заданный профиль) и **гость** (бронирует слот без аккаунта).
На этом этапе фиксируется только внешнее поведение — API-контракт на [TypeSpec](https://typespec.io).

## Документы

- [docs/domain.md](docs/domain.md) — доменные сущности (владелец, тип события, слот,
  бронирование) и правила бронирования.
- [docs/agent-task.md](docs/agent-task.md) — задача для ИИ-агента, генерирующего контракт.
- [docs/coverage.md](docs/coverage.md) — матрица покрытия: сценарий → эндпоинт.
- [docs/e2e-scenarios.md](docs/e2e-scenarios.md) — сквозные сценарии, проверяемые
  Playwright-тестами в [frontend/e2e](frontend/e2e).

## API-контракт (TypeSpec)

Спецификация в каталоге [spec/](spec):

- [main.tsp](spec/main.tsp) — сервис и точка входа;
- [models.tsp](spec/models.tsp) — модели данных и формат ошибок;
- [event-types.tsp](spec/event-types.tsp), [slots.tsp](spec/slots.tsp),
  [bookings.tsp](spec/bookings.tsp), [owner.tsp](spec/owner.tsp) — операции.

Операции размечены тегами `owner` (админская часть) и `public` (сценарий гостя).

### Генерация OpenAPI (опционально)

```bash
npm install --save-dev @typespec/compiler @typespec/http @typespec/openapi3
npx tsp compile spec/main.tsp --emit @typespec/openapi3
```

Результат — `tsp-output/@typespec/openapi3/openapi.yaml`.

## Бэкенд

Реальный сервер в каталоге [backend/](backend) — реализация контракта на Go
(стандартная библиотека, без фреймворка), хранение в памяти (сбрасывается при
перезапуске). Реализует бизнес-правила: глобальную занятость слота (`409`) и
14-дневное окно записи с рабочими часами `09:00–18:00`, Пн–Пт, в `Owner.timeZone`
(`422`).

```bash
cd backend
go run .          # слушает http://localhost:3000
go test ./...     # unit- и http-тесты, включая конкурентную бронь слота
```

Переменные окружения: `PORT` (по умолчанию `3000`), `FRONTEND_ORIGIN`
(по умолчанию `http://localhost:5173`, для CORS).

## Фронтенд

UI в каталоге [frontend/](frontend) — React + TypeScript + shadcn/ui, реализует
все сценарии контракта. Подробности запуска — в [frontend/README.md](frontend/README.md).

По умолчанию `frontend/.env` указывает на Prism-мок (`http://localhost:4010`,
см. ниже) — так исторически настроены фронтенд-тесты (MSW перехватывает запросы
именно на этот адрес). Чтобы фронтенд работал с реальным бэкендом, поменяйте
в `frontend/.env` значение на `VITE_API_BASE_URL=http://localhost:3000`
(бэкенд поднят — см. раздел «Бэкенд» выше), затем:

```bash
cd frontend
npm install
npm run dev
```

Чтобы вместо этого разрабатывать фронтенд изолированно, без бэкенда, — поднимите
Prism-мок из контракта (адрес по умолчанию в `.env` уже на него указывает):

```bash
npm install
npm run spec:compile
npm run mock          # запускает Prism на http://localhost:4010
```