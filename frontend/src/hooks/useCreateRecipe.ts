"use client";

import { useCallback, useState } from "react";
import { ApiError, createRecipe } from "@/lib/api/recipes";
import type { Recipe, RecipeInput } from "@/types/recipe";

type UseCreateRecipeResult = {
  submit: (input: RecipeInput) => Promise<Recipe | undefined>;
  isSubmitting: boolean;
  error: string | null;
};

export function useCreateRecipe(): UseCreateRecipeResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (input: RecipeInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      return await createRecipe(input);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.body.message
          : "登録に失敗しました。時間をおいて再度お試しください。",
      );
      return undefined;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submit, isSubmitting, error };
}
