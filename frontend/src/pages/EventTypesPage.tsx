import { Link } from "react-router-dom";
import { useEventTypes } from "@/hooks/useEventTypes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function EventTypesPage() {
  const { data: eventTypes, isLoading, isError } = useEventTypes();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-destructive">Не удалось загрузить типы событий.</p>;
  }

  if (!eventTypes || eventTypes.length === 0) {
    return <p className="text-muted-foreground">Пока нет доступных типов событий.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {eventTypes.map((eventType) => (
        <Link key={eventType.id} to={`/event-types/${eventType.id}`}>
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle>{eventType.name}</CardTitle>
              <CardDescription>{eventType.description}</CardDescription>
            </CardHeader>
            <CardContent>{eventType.durationMinutes} мин</CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
