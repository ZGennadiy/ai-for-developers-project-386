import type { Slot } from "./api/types";

export function formatInTimeZone(
  iso: string,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("ru-RU", { timeZone, ...options }).format(new Date(iso));
}

function dayKeyInTimeZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function groupSlotsByDay(
  slots: Slot[],
  timeZone: string
): Array<{ day: string; slots: Slot[] }> {
  const groups = new Map<string, Slot[]>();
  for (const slot of slots) {
    const key = dayKeyInTimeZone(slot.start, timeZone);
    const bucket = groups.get(key) ?? [];
    bucket.push(slot);
    groups.set(key, bucket);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, daySlots]) => ({ day, slots: daySlots }));
}
