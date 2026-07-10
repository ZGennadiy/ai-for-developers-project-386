import { apiRequest } from "./client";
import type { Owner } from "./types";

export function getOwner(): Promise<Owner> {
  return apiRequest<{ owner: Owner }>("/owner").then((res) => res.owner);
}
