import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useEventType } from "@/hooks/useEventTypes";
import { useOwner } from "@/hooks/useOwner";
import { listAvailableSlots } from "@/lib/api/slots";
import { SlotsCalendar } from "@/components/slots/SlotsCalendar";
import { BookingDialog } from "@/components/bookings/BookingDialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Slot } from "@/lib/api/types";

export function EventTypeDetailPage() {
  const { eventTypeId } = useParams<{ eventTypeId: string }>();
  const id = eventTypeId!;
  const eventTypeQuery = useEventType(id);
  const slotsQuery = useQuery({
    queryKey: ["event-types", id, "slots"],
    queryFn: () => listAvailableSlots(id),
  });
  const ownerQuery = useOwner();
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  if (eventTypeQuery.isLoading || ownerQuery.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (eventTypeQuery.isError || !eventTypeQuery.data) {
    return (
      <p className="text-destructive">
        Тип события не найден.{" "}
        <Link to="/" className="underline">
          Вернуться в каталог
        </Link>
      </p>
    );
  }

  const eventType = eventTypeQuery.data;
  const timeZone = ownerQuery.data?.timeZone ?? "UTC";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{eventType.name}</h1>
        <p className="text-muted-foreground">{eventType.description}</p>
        <p className="text-sm text-muted-foreground">{eventType.durationMinutes} мин</p>
      </div>

      {slotsQuery.isLoading && <Skeleton className="h-24 w-full" />}
      {slotsQuery.isError && <p className="text-destructive">Не удалось загрузить слоты.</p>}
      {slotsQuery.data && (
        <SlotsCalendar slots={slotsQuery.data} timeZone={timeZone} onSelect={setSelectedSlot} />
      )}

      <BookingDialog eventTypeId={id} slot={selectedSlot} onClose={() => setSelectedSlot(null)} />
    </div>
  );
}
