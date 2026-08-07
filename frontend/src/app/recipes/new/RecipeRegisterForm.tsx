"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { useCreateRecipe } from "@/hooks/useCreateRecipe";
import { useFetchMetadata } from "@/hooks/useFetchMetadata";
import { useUploadImage } from "@/hooks/useUploadImage";
import styles from "./RecipeRegisterForm.module.css";

export function RecipeRegisterForm() {
  const router = useRouter();
  const { submit, isSubmitting, error } = useCreateRecipe();
  const {
    submit: uploadThumbnail,
    isUploading,
    error: uploadError,
  } = useUploadImage();
  const {
    submit: fetchMetadata,
    isFetching,
    error: fetchError,
  } = useFetchMetadata();

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  // URL自動取得で埋まったサムネイル。ユーザーが画像ファイルを選択した場合は
  // そちらが優先される（送信時の分岐は下のhandleSubmit参照）。
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [memo, setMemo] = useState("");
  const [tags, setTags] = useState<string[]>([]);
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
    const result = await fetchMetadata(url);
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

    const recipe = await submit({
      title,
      url: url.trim() || undefined,
      thumbnailUrl: nextThumbnailUrl,
      memo: memo.trim() || undefined,
      tags,
    });
    if (recipe) {
      router.push("/");
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
          <img src={thumbnailUrl} alt="" className={styles.thumbnailPreview} />
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

      {(uploadError || error || fetchError) && (
        <p role="alert" className={styles.error}>
          {uploadError || error || fetchError}
        </p>
      )}

      <div className={styles.actions}>
        <button type="button" onClick={() => router.push("/")}>
          キャンセル
        </button>
        <button type="submit" disabled={isSubmitting || isUploading}>
          {isSubmitting || isUploading ? "登録中…" : "登録する"}
        </button>
      </div>
    </form>
  );
}
