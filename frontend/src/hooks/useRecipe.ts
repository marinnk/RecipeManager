"use client";

import { useEffect, useState } from "react";
import { ApiError, getRecipe } from "@/lib/api/recipes";
import type { Recipe } from "@/types/recipe";

type UseRecipeResult = {
  recipe: Recipe | null;
  isLoading: boolean;
  error: string | null;
};

export function useRecipe(id: number): UseRecipeResult {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchRecipe() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getRecipe(id);
        if (!ignore) {
          setRecipe(result);
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

    fetchRecipe();

    return () => {
      ignore = true;
    };
  }, [id]);

  return { recipe, isLoading, error };
}
