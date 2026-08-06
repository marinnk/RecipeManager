"use client";

import { useCallback, useState } from "react";
import { ApiError, updateRecipe } from "@/lib/api/recipes";
import type { Recipe, RecipeInput } from "@/types/recipe";

type UseUpdateRecipeResult = {
  submit: (id: number, input: RecipeInput) => Promise<Recipe | undefined>;
  isSubmitting: boolean;
  error: string | null;
};

export function useUpdateRecipe(): UseUpdateRecipeResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (id: number, input: RecipeInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      return await updateRecipe(id, input);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.body.message
          : "更新に失敗しました。時間をおいて再度お試しください。",
      );
      return undefined;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submit, isSubmitting, error };
}
