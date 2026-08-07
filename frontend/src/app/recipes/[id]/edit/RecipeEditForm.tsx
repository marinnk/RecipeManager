"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { useDeleteRecipe } from "@/hooks/useDeleteRecipe";
import { useFetchMetadata } from "@/hooks/useFetchMetadata";
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
  const {
    submit: deleteRecipe,
    isSubmitting: isDeleting,
    error: deleteError,
  } = useDeleteRecipe();
  const {
    submit: fetchMetadata,
    isFetching,
    error: fetchError,
  } = useFetchMetadata();

  const [title, setTitle] = useState(recipe.title);
  const [url, setUrl] = useState(recipe.url ?? "");
  // 既存のサムネイルURL。URL自動取得で上書きされることがあるのでuseStateにしている
  // （新しい画像ファイルが選択された場合は、送信時にそちらが優先される）。
  const [thumbnailUrl, setThumbnailUrl] = useState(recipe.thumbnailUrl ?? undefined);
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

  const handleFetchMetadata = async () => {
    const result = await fetchMetadata(url.trim());
    if (result) {
      setTitle(result.title);
      setThumbnailUrl(result.thumbnailUrl ?? undefined);
      // 前に選んでいたファイルが残っていると、自動取得したサムネイルより
      // 優先されてプレビュー・送信に使われてしまうため、ここで解除しておく。
      setThumbnailFile(null);
    }
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
      url: url.trim() || undefined,
      thumbnailUrl: nextThumbnailUrl,
      memo: memo.trim() || undefined,
      tags,
    });
    if (updated) {
      // 一覧・詳細のどちらから編集画面に来たかによって戻り先を変えたいので、
      // 常に"/"へ飛ばすのではなく、ブラウザ履歴を1つ戻る（＝来た画面に戻る）。
      router.back();
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`「${recipe.title}」を削除しますか？`)) {
      return;
    }
    const success = await deleteRecipe(recipeId);
    if (success) {
      router.back();
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="url">URL（任意）</label>
        <div className={styles.urlRow}>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="button"
            onClick={handleFetchMetadata}
            disabled={!url.trim() || isFetching}
          >
            {isFetching ? "取得中…" : "自動取得"}
          </button>
        </div>
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

      {(uploadError || error || deleteError || fetchError) && (
        <p role="alert" className={styles.error}>
          {uploadError || error || deleteError || fetchError}
        </p>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.deleteButton}
          disabled={isDeleting}
          onClick={handleDelete}
        >
          {isDeleting ? "削除中…" : "削除する"}
        </button>
        <button type="button" onClick={() => router.back()}>
          キャンセル
        </button>
        <button type="submit" disabled={isSubmitting || isUploading}>
          {isSubmitting || isUploading ? "更新中…" : "更新する"}
        </button>
      </div>
    </form>
  );
}
