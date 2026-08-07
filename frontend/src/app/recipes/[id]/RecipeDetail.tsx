"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeleteRecipe } from "@/hooks/useDeleteRecipe";
import { useRecipe } from "@/hooks/useRecipe";
import type { Recipe } from "@/types/recipe";
import styles from "./RecipeDetail.module.css";

type Props = {
  recipeId: number;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function RecipeDetail({ recipeId }: Props) {
  const { recipe, isLoading, error: loadError } = useRecipe(recipeId);

  if (isLoading) {
    return <p>読み込み中…</p>;
  }

  if (loadError || !recipe) {
    return (
      <p role="alert" className={styles.error}>
        {loadError}
      </p>
    );
  }

  return <RecipeDetailContent recipe={recipe} />;
}

function RecipeDetailContent({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const {
    submit: deleteRecipe,
    isSubmitting: isDeleting,
    error: deleteError,
  } = useDeleteRecipe();

  const handleDelete = async () => {
    if (!window.confirm(`「${recipe.title}」を削除しますか？`)) {
      return;
    }
    const success = await deleteRecipe(recipe.id);
    if (success) {
      router.push("/");
    }
  };

  return (
    <div className={styles.wrapper}>
      <Link href="/" className={styles.backLink}>
        ← 一覧に戻る
      </Link>

      {recipe.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={recipe.thumbnailUrl} alt="" className={styles.thumbnail} />
      ) : (
        <div className={styles.thumbnailPlaceholder} />
      )}

      <h1 className={styles.title}>{recipe.title}</h1>

      {recipe.tags.length > 0 && (
        <div className={styles.tagList}>
          {recipe.tags.map((tag) => (
            <span key={tag} className={styles.tagChip}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <p className={styles.meta}>
        登録日 {formatDate(recipe.createdAt)} ／ 更新日 {formatDate(recipe.updatedAt)}
      </p>

      <a
        href={recipe.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.sourceLink}
      >
        元サイトを開く ↗
      </a>

      {recipe.memo && (
        <div className={styles.memoSection}>
          <h2 className={styles.memoLabel}>メモ</h2>
          <p className={styles.memo}>{recipe.memo}</p>
        </div>
      )}

      {deleteError && (
        <p role="alert" className={styles.error}>
          {deleteError}
        </p>
      )}

      <div className={styles.actions}>
        <Link href={`/recipes/${recipe.id}/edit`} className={styles.editButton}>
          編集する
        </Link>
        <button
          type="button"
          className={styles.deleteButton}
          disabled={isDeleting}
          onClick={handleDelete}
        >
          {isDeleting ? "削除中…" : "削除する"}
        </button>
      </div>
    </div>
  );
}
