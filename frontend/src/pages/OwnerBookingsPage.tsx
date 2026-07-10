import { useOwnerBookings } from "@/hooks/useBookings";
import { useOwner } from "@/hooks/useOwner";
import { formatInTimeZone } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function OwnerBookingsPage() {
  const bookingsQuery = useOwnerBookings();
  const ownerQuery = useOwner();

  if (bookingsQuery.isLoading || ownerQuery.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (bookingsQuery.isError) {
    return <p className="text-destructive">Не удалось загрузить встречи.</p>;
  }

  const bookings = bookingsQuery.data ?? [];
  const timeZone = ownerQuery.data?.timeZone ?? "UTC";

  if (bookings.length === 0) {
    return <p className="text-muted-foreground">Предстоящих встреч нет.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Когда</TableHead>
          <TableHead>Тип события</TableHead>
          <TableHead>Гость</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell>
              {formatInTimeZone(booking.start, timeZone, { dateStyle: "medium", timeStyle: "short" })}
            </TableCell>
            <TableCell>{booking.eventTypeName}</TableCell>
            <TableCell>{booking.guestName}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
