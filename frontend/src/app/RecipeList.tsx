"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDeleteRecipe } from "@/hooks/useDeleteRecipe";
import { useRecipes } from "@/hooks/useRecipes";
import { useTags } from "@/hooks/useTags";
import type { Recipe } from "@/types/recipe";
import { RecipeFilterBar } from "./RecipeFilterBar";
import styles from "./RecipeList.module.css";

const KEYWORD_DEBOUNCE_MS = 300;

export function RecipeList() {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 1文字入力するたびにAPIを呼ぶと無駄なリクエストが発生するため、入力が
  // 300ms止まってから初めて検索条件に反映する。
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, KEYWORD_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [keyword]);

  const { recipes, isLoading, error, refetch } = useRecipes({
    keyword: debouncedKeyword,
    tags: selectedTags,
  });
  const { tags: availableTags } = useTags();
  const {
    submit: deleteRecipe,
    isSubmitting: isDeleting,
    error: deleteError,
  } = useDeleteRecipe();

  const isFiltering = keyword !== "" || selectedTags.length > 0;

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleClearFilter = () => {
    setKeyword("");
    setDebouncedKeyword("");
    setSelectedTags([]);
  };

  const handleDelete = async (recipe: Recipe) => {
    if (!window.confirm(`「${recipe.title}」を削除しますか？`)) {
      return;
    }
    const success = await deleteRecipe(recipe.id);
    if (success) {
      refetch();
    }
  };

  return (
    <>
      <RecipeFilterBar
        keyword={keyword}
        onKeywordChange={setKeyword}
        availableTags={availableTags}
        selectedTags={selectedTags}
        onToggleTag={handleToggleTag}
        onClear={handleClearFilter}
      />

      {isLoading && <p>読み込み中…</p>}

      {!isLoading && error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      {!isLoading && !error && recipes.length === 0 && (
        <p className={styles.empty}>
          {isFiltering
            ? "条件に一致するレシピが見つかりません。"
            : "レシピがありません。まずは登録しましょう。"}
        </p>
      )}

      {!isLoading && !error && recipes.length > 0 && (
        <>
          {deleteError && (
            <p role="alert" className={styles.error}>
              {deleteError}
            </p>
          )}
          <ul className={styles.grid}>
            {recipes.map((recipe) => (
              <li key={recipe.id} className={styles.card}>
                <Link href={`/recipes/${recipe.id}`} className={styles.cardLink}>
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
                  <h3 className={styles.title}>{recipe.title}</h3>
                </Link>
                <div className={styles.body}>
                  <div className={styles.tagList}>
                    {recipe.tags.map((tag) => (
                      <span key={tag} className={styles.tagChip}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      disabled={isDeleting}
                      onClick={() => handleDelete(recipe)}
                    >
                      削除
                    </button>
                    <Link href={`/recipes/${recipe.id}/edit`} className={styles.editLink}>
                      編集
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
