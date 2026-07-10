# Frontend — Календарь бронирования

React + TypeScript + shadcn/ui интерфейс поверх API-контракта из `../spec`.

## Разработка

Из корня репозитория, в одном терминале — поднять Prism-мок из контракта:

```bash
npm install
npm run spec:compile
npm run mock
```

В другом терминале — сам фронтенд:

```bash
cd frontend
npm install
npm run dev
```

Откройте адрес, который выведет Vite (обычно http://localhost:5173).

`VITE_API_BASE_URL` в `.env` задаёт адрес API (по умолчанию — Prism, `http://localhost:4010`).
Чтобы переключиться на настоящий бэкенд, поменяйте значение переменной.

## Тесты

```bash
npm run test
```
