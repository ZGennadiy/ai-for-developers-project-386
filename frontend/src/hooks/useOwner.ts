import { useQuery } from "@tanstack/react-query";
import { getOwner } from "@/lib/api/owner";

export function useOwner() {
  return useQuery({ queryKey: ["owner"], queryFn: getOwner });
}
