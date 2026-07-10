import { describe, expect, it } from "vitest";
import { slotsFixture } from "@/test/handlers";
import { ApiError } from "./client";
import { listAvailableSlots } from "./slots";

describe("listAvailableSlots", () => {
  it("lists available slots for an event type", async () => {
    const result = await listAvailableSlots("intro-call");
    expect(result).toEqual(slotsFixture);
  });

  it("throws ApiError 404 for an unknown event type", async () => {
    await expect(listAvailableSlots("missing")).rejects.toBeInstanceOf(ApiError);
  });
});
