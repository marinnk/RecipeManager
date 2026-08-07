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
    return <p className="hint-text">読み込み中…</p>;
  }

  if (loadError || !recipe) {
    return (
      <p role="alert" className="error-text">
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
      <Link href="/" className={`${styles.backLink} btn btn-ghost`}>
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
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <p className={`${styles.meta} hint-text`}>
        登録日 {formatDate(recipe.createdAt)} ／ 更新日 {formatDate(recipe.updatedAt)}
      </p>

      {recipe.url && (
        <a
          href={recipe.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.sourceLink}
        >
          元サイトを開く ↗
        </a>
      )}

      {recipe.memo && (
        <div className={styles.memoSection}>
          <h2 className={styles.memoLabel}>メモ</h2>
          <p className={styles.memo}>{recipe.memo}</p>
        </div>
      )}

      {deleteError && (
        <p role="alert" className="error-text">
          {deleteError}
        </p>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.deleteButton} btn btn-danger`}
          disabled={isDeleting}
          onClick={handleDelete}
        >
          {isDeleting ? "削除中…" : "削除する"}
        </button>
        <Link href={`/recipes/${recipe.id}/edit`} className="btn btn-ghost">
          編集する
        </Link>
      </div>
    </div>
  );
}
