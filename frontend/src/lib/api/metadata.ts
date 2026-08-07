import type { ApiErrorBody } from "@/types/recipe";
import type { MetadataFetchResult } from "@/types/metadata";
import { ApiError } from "./recipes";

export async function fetchMetadata(url: string): Promise<MetadataFetchResult> {
  const res = await fetch("/api/metadata/fetch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const body: ApiErrorBody = await res.json();
    throw new ApiError(res.status, body);
  }

  return res.json();
}
