"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, getRecipes } from "@/lib/api/recipes";
import type { Recipe } from "@/types/recipe";

type UseRecipesParams = {
  keyword?: string;
  tags?: string[];
};

type UseRecipesResult = {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useRecipes(params: UseRecipesParams = {}): UseRecipesResult {
  const { keyword, tags = [] } = params;
  // tags配列をそのまま依存配列に入れると、呼び出し側が毎レンダーで新しい配列を
  // 渡した場合に参照が変わって無駄な再フェッチが起きてしまう。中身が同じかどうかで
  // 比較できるよう、文字列化したものを依存値として使う。
  const tagsKey = tags.join(",");

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // refetch()を呼ぶたびに値を変え、下のuseEffectを再実行させるためのトリガー。
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function fetchRecipes() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getRecipes({ keyword, tags });
        if (!ignore) {
          setRecipes(result);
        }
      } catch (e) {
        if (!ignore) {
          setError(
            e instanceof ApiError
              ? e.body.message
              : "レシピの取得に失敗しました。時間をおいて再度お試しください。",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    fetchRecipes();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tagsの中身の変化はtagsKeyで検知する
  }, [keyword, tagsKey, refetchToken]);

  const refetch = useCallback(() => {
    setRefetchToken((token) => token + 1);
  }, []);

  return { recipes, isLoading, error, refetch };
}
