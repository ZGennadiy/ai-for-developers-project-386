import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateEventType, useEventTypes } from "@/hooks/useEventTypes";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";

const eventTypeSchema = z.object({
  id: z.string().min(1, "Укажите идентификатор"),
  name: z.string().min(1, "Укажите название"),
  description: z.string(),
  durationMinutes: z.coerce.number().min(1, "Длительность должна быть больше 0"),
});

type EventTypeFormValues = z.infer<typeof eventTypeSchema>;
type EventTypeFormInput = z.input<typeof eventTypeSchema>;

export function OwnerEventTypesPage() {
  const eventTypesQuery = useEventTypes();
  const createEventType = useCreateEventType();
  const form = useForm<EventTypeFormInput, unknown, EventTypeFormValues>({
    resolver: zodResolver(eventTypeSchema),
    defaultValues: { id: "", name: "", description: "", durationMinutes: 30 },
  });

  const onSubmit = (values: EventTypeFormValues) => {
    createEventType.mutate(values, {
      onSuccess: () => {
        toast.success("Тип события создан");
        form.reset({ id: "", name: "", description: "", durationMinutes: 30 });
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          form.setError("id", { message: error.message });
          return;
        }
        const message = error instanceof ApiError ? error.message : "Не удалось создать тип события";
        toast.error(message);
      },
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Новый тип события</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Идентификатор</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Длительность (мин)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value as number | string} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={createEventType.isPending}>
                Создать
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Существующие типы</h2>
        {eventTypesQuery.isLoading && <Skeleton className="h-24 w-full" />}
        {eventTypesQuery.isError && (
          <p className="text-destructive">Не удалось загрузить типы событий.</p>
        )}
        {eventTypesQuery.data && eventTypesQuery.data.length === 0 && (
          <p className="text-muted-foreground">Типов событий пока нет.</p>
        )}
        {eventTypesQuery.data && eventTypesQuery.data.length > 0 && (
          <ul className="space-y-2">
            {eventTypesQuery.data.map((eventType) => (
              <li key={eventType.id} className="rounded border p-3">
                <span className="font-medium">{eventType.name}</span>{" "}
                <span className="text-muted-foreground">({eventType.durationMinutes} мин)</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
