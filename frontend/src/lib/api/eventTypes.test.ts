import { describe, expect, it } from "vitest";
import { eventTypesFixture } from "@/test/handlers";
import { createEventType, getEventType, listEventTypes } from "./eventTypes";
import { ApiError } from "./client";

describe("eventTypes API", () => {
  it("lists event types", async () => {
    const result = await listEventTypes();
    expect(result).toEqual(eventTypesFixture);
  });

  it("gets one event type by id", async () => {
    const result = await getEventType("intro-call");
    expect(result.name).toBe("Знакомство");
  });

  it("throws ApiError 404 for an unknown event type", async () => {
    await expect(getEventType("missing")).rejects.toBeInstanceOf(ApiError);
  });

  it("creates an event type", async () => {
    const created = await createEventType({
      id: "new-type",
      name: "Демо",
      description: "Демо-звонок",
      durationMinutes: 45,
    });
    expect(created.id).toBe("new-type");
  });

  it("throws ApiError 409 when the id already exists", async () => {
    await expect(
      createEventType({
        id: "intro-call",
        name: "Дубликат",
        description: "",
        durationMinutes: 15,
      })
    ).rejects.toMatchObject({ status: 409 });
  });
});
