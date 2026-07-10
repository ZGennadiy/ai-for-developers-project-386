import { useQuery } from "@tanstack/react-query";
import { listAvailableSlots } from "@/lib/api/slots";

export function useSlots(eventTypeId: string) {
  return useQuery({
    queryKey: ["event-types", eventTypeId, "slots"],
    queryFn: () => listAvailableSlots(eventTypeId),
  });
}
