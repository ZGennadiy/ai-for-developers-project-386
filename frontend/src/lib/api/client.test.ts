import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { apiRequest } from "./client";

describe("apiRequest", () => {
  it("returns parsed JSON on success", async () => {
    server.use(
      http.get("http://localhost:4010/owner", () =>
        HttpResponse.json({ owner: { id: "1", name: "Test", email: "a@b.com", timeZone: "UTC" } })
      )
    );

    const result = await apiRequest<{ owner: { id: string } }>("/owner");
    expect(result.owner.id).toBe("1");
  });

  it("throws ApiError with code, message and status on error response", async () => {
    server.use(
      http.get("http://localhost:4010/owner", () =>
        HttpResponse.json({ code: "not_found", message: "Владелец не найден" }, { status: 404 })
      )
    );

    await expect(apiRequest("/owner")).rejects.toMatchObject({
      code: "not_found",
      message: "Владелец не найден",
      status: 404,
    });
  });

  it("sends a JSON body for POST requests", async () => {
    let capturedBody: unknown;
    server.use(
      http.post("http://localhost:4010/bookings", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ created: capturedBody }, { status: 201 });
      })
    );

    await apiRequest("/bookings", { method: "POST", body: { guestName: "Иван" } });
    expect(capturedBody).toEqual({ guestName: "Иван" });
  });
});
