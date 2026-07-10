import { describe, expect, it } from "vitest";
import { formatInTimeZone, groupSlotsByDay } from "./format";

describe("formatInTimeZone", () => {
  it("formats an ISO instant in the given IANA timezone", () => {
    const result = formatInTimeZone("2026-07-10T09:00:00Z", "Europe/Moscow", {
      hour: "2-digit",
      minute: "2-digit",
    });
    expect(result).toContain("12"); // UTC+3
  });
});

describe("groupSlotsByDay", () => {
  it("groups slots by calendar day in the target timezone, sorted ascending", () => {
    const slots = [
      { start: "2026-07-11T09:00:00Z", end: "2026-07-11T09:30:00Z" },
      { start: "2026-07-10T21:30:00Z", end: "2026-07-10T22:00:00Z" }, // 2026-07-11 00:30 Moscow
      { start: "2026-07-10T09:00:00Z", end: "2026-07-10T09:30:00Z" },
    ];

    const groups = groupSlotsByDay(slots, "Europe/Moscow");

    expect(groups).toHaveLength(2);
    expect(groups[0].day).toBe("2026-07-10");
    expect(groups[0].slots).toHaveLength(1);
    expect(groups[1].day).toBe("2026-07-11");
    expect(groups[1].slots).toHaveLength(2);
  });
});
