"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { useRecipe } from "@/hooks/useRecipe";
import { useUpdateRecipe } from "@/hooks/useUpdateRecipe";
import { useUploadImage } from "@/hooks/useUploadImage";
import type { Recipe } from "@/types/recipe";
import styles from "./RecipeEditForm.module.css";

type Props = {
  recipeId: number;
};

export function RecipeEditForm({ recipeId }: Props) {
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

  // 取得済みのレシピをkeyに使い、レシピが切り替わったときにフォームの内部状態を
  // 初期値からやり直させる（recipeが変わるたびにuseEffectでsetStateし直すよりも、
  // Reactの推奨パターンである「keyでコンポーネントを再マウントする」方が素直なため）。
  return <RecipeEditFormFields key={recipe.id} recipeId={recipeId} recipe={recipe} />;
}

type FieldsProps = {
  recipeId: number;
  recipe: Recipe;
};

function RecipeEditFormFields({ recipeId, recipe }: FieldsProps) {
  const router = useRouter();
  const { submit, isSubmitting, error } = useUpdateRecipe();
  const {
    submit: uploadThumbnail,
    isUploading,
    error: uploadError,
  } = useUploadImage();

  const [title, setTitle] = useState(recipe.title);
  const [url, setUrl] = useState(recipe.url);
  // 既存のサムネイルURLはユーザーが直接編集する項目ではなく、新しい画像が
  // 選択された場合のみ送信時に上書きされるので、setterを持たない定数として扱う。
  const thumbnailUrl = recipe.thumbnailUrl ?? undefined;
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [memo, setMemo] = useState(recipe.memo ?? "");
  const [tags, setTags] = useState<string[]>(recipe.tags);
  const [tagDraft, setTagDraft] = useState("");

  const addTag = () => {
    const trimmed = tagDraft.trim();
    if (trimmed !== "" && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagDraft("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // IME変換確定のEnterでも"Enter"イベントが発火するため、isComposingで
    // 変換中かどうかを判定し、変換確定のEnterではタグを追加しないようにする。
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      addTag();
    }
  };

  const handleThumbnailFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setThumbnailFile(e.target.files?.[0] ?? null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let nextThumbnailUrl = thumbnailUrl;
    if (thumbnailFile) {
      const uploaded = await uploadThumbnail(thumbnailFile);
      if (!uploaded) {
        // アップロード失敗時はここで中断する。エラーはuseUploadImageが保持している。
        return;
      }
      nextThumbnailUrl = uploaded.url;
    }

    const updated = await submit(recipeId, {
      title,
      url,
      thumbnailUrl: nextThumbnailUrl,
      memo: memo.trim() || undefined,
      tags,
    });
    if (updated) {
      router.push("/");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="url">URL</label>
        <input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="title">タイトル</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="thumbnailFile">サムネイル画像（任意）</label>
        {!thumbnailFile && thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt=""
            className={styles.thumbnailPreview}
          />
        )}
        <input
          id="thumbnailFile"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleThumbnailFileChange}
        />
        {isUploading && (
          <p className={styles.uploadStatus}>アップロード中…</p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="memo">メモ（任意）</label>
        <textarea
          id="memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="tagDraft">タグ</label>
        <div className={styles.tagList}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tagChip}>
              #{tag}
              <button
                type="button"
                aria-label={`${tag}を削除`}
                onClick={() => removeTag(tag)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className={styles.tagInputRow}>
          <input
            id="tagDraft"
            type="text"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={handleTagKeyDown}
          />
          <button type="button" onClick={addTag}>
            + 追加
          </button>
        </div>
        <p className={styles.tagHint}>Enterキーでも追加できます</p>
      </div>

      {(uploadError || error) && (
        <p role="alert" className={styles.error}>
          {uploadError || error}
        </p>
      )}

      <div className={styles.actions}>
        <button type="button" onClick={() => router.push("/")}>
          キャンセル
        </button>
        <button type="submit" disabled={isSubmitting || isUploading}>
          {isSubmitting || isUploading ? "更新中…" : "更新する"}
        </button>
      </div>
    </form>
  );
}
