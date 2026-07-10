import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateBooking } from "@/hooks/useBookings";
import { ApiError } from "@/lib/api/client";
import type { Slot } from "@/lib/api/types";

const bookingSchema = z.object({
  guestName: z.string().min(1, "Укажите имя"),
  guestEmail: z.string().email("Некорректный email"),
  note: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingDialogProps {
  eventTypeId: string;
  slot: Slot | null;
  onClose: () => void;
}

export function BookingDialog({ eventTypeId, slot, onClose }: BookingDialogProps) {
  const navigate = useNavigate();
  const createBooking = useCreateBooking(eventTypeId);
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { guestName: "", guestEmail: "", note: "" },
  });

  useEffect(() => {
    if (slot) form.reset({ guestName: "", guestEmail: "", note: "" });
  }, [slot, form]);

  if (!slot) return null;

  const onSubmit = (values: BookingFormValues) => {
    createBooking.mutate(
      { eventTypeId, start: slot.start, ...values },
      {
        onSuccess: (booking) => {
          onClose();
          navigate(`/bookings/${booking.id}`);
        },
        onError: (error) => {
          const message = error instanceof ApiError ? error.message : "Не удалось создать бронь";
          toast.error(message);
        },
      }
    );
  };

  return (
    <Dialog open={Boolean(slot)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Подтверждение записи</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="guestName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guestEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Заметка (необязательно)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={createBooking.isPending} className="w-full">
              Подтвердить запись
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
