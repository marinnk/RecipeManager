"use client";

import Link from "next/link";
import { useDeleteRecipe } from "@/hooks/useDeleteRecipe";
import { useRecipes } from "@/hooks/useRecipes";
import type { Recipe } from "@/types/recipe";
import styles from "./RecipeList.module.css";

export function RecipeList() {
  const { recipes, isLoading, error, refetch } = useRecipes();
  const {
    submit: deleteRecipe,
    isSubmitting: isDeleting,
    error: deleteError,
  } = useDeleteRecipe();

  const handleDelete = async (recipe: Recipe) => {
    if (!window.confirm(`「${recipe.title}」を削除しますか？`)) {
      return;
    }
    const success = await deleteRecipe(recipe.id);
    if (success) {
      refetch();
    }
  };

  if (isLoading) {
    return <p>読み込み中…</p>;
  }

  if (error) {
    return (
      <p role="alert" className={styles.error}>
        {error}
      </p>
    );
  }

  if (recipes.length === 0) {
    return (
      <p className={styles.empty}>
        レシピがありません。まずは登録しましょう。
      </p>
    );
  }

  return (
    <>
      {deleteError && (
        <p role="alert" className={styles.error}>
          {deleteError}
        </p>
      )}
      <ul className={styles.grid}>
        {recipes.map((recipe) => (
          <li key={recipe.id} className={styles.card}>
            {recipe.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={recipe.thumbnailUrl}
                alt=""
                className={styles.thumbnail}
              />
            ) : (
              <div className={styles.thumbnailPlaceholder} />
            )}
            <div className={styles.body}>
              <h3 className={styles.title}>{recipe.title}</h3>
              <div className={styles.tagList}>
                {recipe.tags.map((tag) => (
                  <span key={tag} className={styles.tagChip}>
                    #{tag}
                  </span>
                ))}
              </div>
              <div className={styles.cardActions}>
                <Link href={`/recipes/${recipe.id}/edit`} className={styles.editLink}>
                  編集
                </Link>
                <button
                  type="button"
                  className={styles.deleteButton}
                  disabled={isDeleting}
                  onClick={() => handleDelete(recipe)}
                >
                  削除
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
