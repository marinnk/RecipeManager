"use client";

import { useCallback, useState } from "react";
import { ApiError, deleteRecipe } from "@/lib/api/recipes";

type UseDeleteRecipeResult = {
  submit: (id: number) => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
};

export function useDeleteRecipe(): UseDeleteRecipeResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (id: number) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await deleteRecipe(id);
      return true;
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.body.message
          : "削除に失敗しました。時間をおいて再度お試しください。",
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submit, isSubmitting, error };
}
