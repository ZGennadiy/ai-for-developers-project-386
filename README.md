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