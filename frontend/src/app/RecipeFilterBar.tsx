"use client";

import type { ChangeEvent } from "react";
import styles from "./RecipeFilterBar.module.css";

type RecipeFilterBarProps = {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  availableTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClear: () => void;
};

// 検索キーワード入力とタグ選択チップだけを持つ表示専用コンポーネント。
// データ取得やデバウンスなどのロジックは持たず、値とコールバックを親(RecipeList)から
// 受け取るだけにすることで、「一覧表示」と「フィルタ入力」の責務を分離している。
export function RecipeFilterBar({
  keyword,
  onKeywordChange,
  availableTags,
  selectedTags,
  onToggleTag,
  onClear,
}: RecipeFilterBarProps) {
  const hasFilter = keyword !== "" || selectedTags.length > 0;

  const handleKeywordChange = (e: ChangeEvent<HTMLInputElement>) => {
    onKeywordChange(e.target.value);
  };

  return (
    <div className={styles.container}>
      <input
        type="text"
        aria-label="タイトルで検索"
        placeholder="タイトルで検索"
        value={keyword}
        onChange={handleKeywordChange}
        className={styles.keywordInput}
      />
      {availableTags.length > 0 && (
        <div className={styles.tagList}>
          {availableTags.map((tag) => {
            const selected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={selected}
                className={selected ? "chip-filter is-on" : "chip-filter"}
                onClick={() => onToggleTag(tag)}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}
      {hasFilter && (
        <button type="button" className="btn btn-ghost" onClick={onClear}>
          条件をクリア
        </button>
      )}
    </div>
  );
}
