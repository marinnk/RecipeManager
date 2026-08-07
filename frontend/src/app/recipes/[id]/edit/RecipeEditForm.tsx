"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
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
  // URL欄からフォーカスが外れるたびに毎回自動取得すると、取得後にタイトルを
  // 手で直しても同じURLのままクリックし直しただけで上書きされてしまう。
  // 直前に取得したURLを覚えておき、変わっていなければ再取得しないようにする。
  // 初期値は既存のURLにしておき、編集せずにURL欄を触っただけでは発火しないようにする。
  const lastFetchedUrlRef = useRef<string | null>(recipe.url ?? null);

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

  // URLとサムネイルをまとめて消す。自動取得したサムネイルは元サイトへの直リンクの
  // ままなので、URLだけ消してサムネイルが残ると中途半端で二度手間になる
  // （手動でアップロードしたファイルは別状態(thumbnailFile)で管理しているので影響しない）。
  const clearUrl = () => {
    setUrl("");
    setThumbnailUrl(undefined);
    lastFetchedUrlRef.current = null;
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    if (!value.trim() && thumbnailUrl) {
      setThumbnailUrl(undefined);
      lastFetchedUrlRef.current = null;
    }
  };

  const runFetchMetadata = async (targetUrl: string) => {
    lastFetchedUrlRef.current = targetUrl;
    const result = await fetchMetadata(targetUrl);
    if (result) {
      setTitle(result.title);
      setThumbnailUrl(result.thumbnailUrl ?? undefined);
      // 前に選んでいたファイルが残っていると、自動取得したサムネイルより
      // 優先されてプレビュー・送信に使われてしまうため、ここで解除しておく。
      setThumbnailFile(null);
    }
  };

  // ボタンを押したときは、直前と同じURLでも明示的なやり直しとして必ず取得する。
  const handleFetchMetadataClick = () => {
    runFetchMetadata(url.trim());
  };

  // URL欄からフォーカスが外れたときは、URLが変わっている場合だけ自動で取得する。
  const handleUrlBlur = () => {
    const trimmed = url.trim();
    if (!trimmed || trimmed === lastFetchedUrlRef.current) {
      return;
    }
    runFetchMetadata(trimmed);
  };

  // タグ入力と同じく、Enterキーでも即座に取得できるようにする（IME変換確定の
  // Enterでは発火しないようisComposingを見る）。ボタンと同じ「明示的な操作」
  // として扱うので、URLが変わっていなくても必ず取得する。
  const handleUrlKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (url.trim()) {
        handleFetchMetadataClick();
      }
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
            onChange={handleUrlChange}
            onBlur={handleUrlBlur}
            onKeyDown={handleUrlKeyDown}
            maxLength={2048}
          />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleFetchMetadataClick}
            disabled={!url.trim() || isFetching}
          >
            {isFetching ? "取得中…" : "自動取得"}
          </button>
          <button
            type="button"
            className="btn-icon"
            aria-label="URLを削除"
            onClick={clearUrl}
            disabled={!url.trim()}
          >
            ×
          </button>
        </div>
        <p className={`${styles.urlHint} hint-text`}>Enterキーでも取得できます</p>
      </div>

      <div className={styles.field}>
        <label htmlFor="title">タイトル</label>
        <div className={styles.titleRow}>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={255}
          />
          <button
            type="button"
            className="btn-icon"
            aria-label="タイトルを削除"
            onClick={() => setTitle("")}
            disabled={!title.trim()}
          >
            ×
          </button>
        </div>
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
          <p className="hint-text">アップロード中…</p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="memo">メモ（任意）</label>
        <div className={styles.memoRow}>
          <textarea
            id="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            maxLength={2000}
          />
          <button
            type="button"
            className="btn-icon"
            aria-label="メモを削除"
            onClick={() => setMemo("")}
            disabled={!memo.trim()}
          >
            ×
          </button>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="tagDraft">タグ</label>
        <div className={styles.tagList}>
          {tags.map((tag) => (
            <span key={tag} className="tag">
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
            maxLength={30}
          />
          <button type="button" className="btn btn-ghost" onClick={addTag}>
            + 追加
          </button>
        </div>
        <p className={`${styles.tagHint} hint-text`}>Enterキーでも追加できます</p>
      </div>

      {(uploadError || error || deleteError || fetchError) && (
        <p role="alert" className="error-text">
          {uploadError || error || deleteError || fetchError}
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
        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
          キャンセル
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting || isUploading}>
          {isSubmitting || isUploading ? "更新中…" : "更新する"}
        </button>
      </div>
    </form>
  );
}
