# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ENV VITE_API_BASE_URL=/api
RUN npm run build

FROM golang:1.25-alpine AS backend-build
WORKDIR /app/backend
COPY backend/ ./
RUN CGO_ENABLED=0 go build -o /out/server .

FROM alpine:3.22
WORKDIR /app
COPY --from=backend-build /out/server ./server
COPY --from=frontend-build /app/frontend/dist ./static

ENV STATIC_DIR=/app/static
# EXPOSE is informational only -- Render/Railway inject PORT at runtime and
# the app reads it via os.Getenv("PORT") directly.
EXPOSE 3000

CMD ["./server"]
