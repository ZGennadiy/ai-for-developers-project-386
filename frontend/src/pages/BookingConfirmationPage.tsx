import { Link, useParams } from "react-router-dom";
import { useBooking } from "@/hooks/useBookings";
import { useOwner } from "@/hooks/useOwner";
import { formatInTimeZone } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BookingConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const bookingQuery = useBooking(bookingId!);
  const ownerQuery = useOwner();

  if (bookingQuery.isLoading || ownerQuery.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (bookingQuery.isError || !bookingQuery.data) {
    return (
      <p className="text-destructive">
        Бронирование не найдено.{" "}
        <Link to="/" className="underline">
          Вернуться в каталог
        </Link>
      </p>
    );
  }

  const booking = bookingQuery.data;
  const timeZone = ownerQuery.data?.timeZone ?? "UTC";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Бронь подтверждена</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p>{booking.eventTypeName}</p>
        <p>{formatInTimeZone(booking.start, timeZone, { dateStyle: "full", timeStyle: "short" })}</p>
        <p className="text-muted-foreground">
          Гость: {booking.guestName} ({booking.guestEmail})
        </p>
        {booking.note && <p className="text-muted-foreground">Заметка: {booking.note}</p>}
      </CardContent>
    </Card>
  );
}
