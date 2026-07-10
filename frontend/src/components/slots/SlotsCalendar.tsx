import { Button } from "@/components/ui/button";
import { formatInTimeZone, groupSlotsByDay } from "@/lib/format";
import type { Slot } from "@/lib/api/types";

interface SlotsCalendarProps {
  slots: Slot[];
  timeZone: string;
  onSelect: (slot: Slot) => void;
}

export function SlotsCalendar({ slots, timeZone, onSelect }: SlotsCalendarProps) {
  const groups = groupSlotsByDay(slots, timeZone);

  if (groups.length === 0) {
    return <p className="text-muted-foreground">Нет свободных слотов на ближайшие 14 дней.</p>;
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.day}>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            {formatInTimeZone(group.slots[0].start, timeZone, {
              day: "2-digit",
              month: "long",
              weekday: "short",
            })}
          </h3>
          <div className="flex flex-wrap gap-2">
            {group.slots.map((slot) => (
              <Button key={slot.start} variant="outline" size="sm" onClick={() => onSelect(slot)}>
                {formatInTimeZone(slot.start, timeZone, { hour: "2-digit", minute: "2-digit" })}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
