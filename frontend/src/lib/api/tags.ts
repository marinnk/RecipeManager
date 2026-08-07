import type { ApiErrorBody } from "@/types/recipe";
import { ApiError } from "./recipes";

export async function getTags(): Promise<string[]> {
  const res = await fetch("/api/tags");

  if (!res.ok) {
    const body: ApiErrorBody = await res.json();
    throw new ApiError(res.status, body);
  }

  return res.json();
}
