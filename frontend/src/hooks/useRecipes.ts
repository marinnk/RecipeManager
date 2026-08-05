"use client";

import { useEffect, useState } from "react";
import { ApiError, getRecipes } from "@/lib/api/recipes";
import type { Recipe } from "@/types/recipe";

type UseRecipesResult = {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
};

export function useRecipes(): UseRecipesResult {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchRecipes() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getRecipes();
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
  }, []);

  return { recipes, isLoading, error };
}
