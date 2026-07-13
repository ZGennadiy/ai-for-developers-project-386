import type { ApiErrorPayload } from "./types";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.code = payload.code;
    this.status = status;
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4010";

interface RequestOptions {
  method?: string;
  body?: unknown;
  searchParams?: Record<string, string | undefined>;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(BASE_URL + path, window.location.origin);
  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const payload = (await response.json()) as ApiErrorPayload;
    throw new ApiError(response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
