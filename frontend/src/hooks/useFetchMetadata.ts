"use client";

import { useCallback, useState } from "react";
import { ApiError } from "@/lib/api/recipes";
import { fetchMetadata } from "@/lib/api/metadata";
import type { MetadataFetchResult } from "@/types/metadata";

type UseFetchMetadataResult = {
  submit: (url: string) => Promise<MetadataFetchResult | undefined>;
  isFetching: boolean;
  error: string | null;
};

export function useFetchMetadata(): UseFetchMetadataResult {
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (url: string) => {
    setIsFetching(true);
    setError(null);
    try {
      return await fetchMetadata(url);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.body.message
          : "情報を取得できませんでした。手動で入力してください。",
      );
      return undefined;
    } finally {
      setIsFetching(false);
    }
  }, []);

  return { submit, isFetching, error };
}
