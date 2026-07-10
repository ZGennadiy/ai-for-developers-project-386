import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEventType, getEventType, listEventTypes } from "@/lib/api/eventTypes";
import type { CreateEventTypeRequest } from "@/lib/api/types";

export function useEventTypes() {
  return useQuery({ queryKey: ["event-types"], queryFn: listEventTypes });
}

export function useEventType(eventTypeId: string) {
  return useQuery({
    queryKey: ["event-types", eventTypeId],
    queryFn: () => getEventType(eventTypeId),
  });
}

export function useCreateEventType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventTypeRequest) => createEventType(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-types"] });
    },
  });
}
