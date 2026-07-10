import { apiRequest } from "./client";
import type { Owner } from "./types";

export function getOwner(): Promise<Owner> {
  return apiRequest<Owner>("/owner");
}
