"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/recipes";
import { getTags } from "@/lib/api/tags";

type UseTagsResult = {
  tags: string[];
  isLoading: boolean;
  error: string | null;
};

// フィルターUIの選択肢用にタグ一覧を取得するだけのフック。
// レシピの絞り込み結果とは独立して、常に全タグを返すAPIを叩く
// （絞り込むほど選択肢が減っていく、という挙動を避けるため）。
export function useTags(): UseTagsResult {
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchTags() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getTags();
        if (!ignore) {
          setTags(result);
        }
      } catch (e) {
        if (!ignore) {
          setError(
            e instanceof ApiError
              ? e.body.message
              : "タグ一覧の取得に失敗しました。時間をおいて再度お試しください。",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    fetchTags();

    return () => {
      ignore = true;
    };
  }, []);

  return { tags, isLoading, error };
}
