import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError, getRecipe } from "@/lib/api/recipes";
import { useRecipe } from "./useRecipe";

vi.mock("@/lib/api/recipes", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/recipes")>(
    "@/lib/api/recipes",
  );
  return { ...actual, getRecipe: vi.fn() };
});

describe("useRecipe", () => {
  it("マウント時に指定したidのレシピを取得し、成功時はrecipeにセットする", async () => {
    const recipe = {
      id: 1,
      title: "肉じゃが",
      url: "https://example.com",
      thumbnailUrl: null,
      memo: null,
      tags: ["和食"],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    vi.mocked(getRecipe).mockResolvedValue(recipe);

    const { result } = renderHook(() => useRecipe(1));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getRecipe).toHaveBeenCalledWith(1);
    expect(result.current.recipe).toEqual(recipe);
    expect(result.current.error).toBeNull();
  });

  it("ApiErrorの場合はサーバーのメッセージをerrorに設定する", async () => {
    vi.mocked(getRecipe).mockRejectedValue(
      new ApiError(404, { error: "NOT_FOUND", message: "id=1 のレシピが見つかりません" }),
    );

    const { result } = renderHook(() => useRecipe(1));

    await waitFor(() =>
      expect(result.current.error).toBe("id=1 のレシピが見つかりません"),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.recipe).toBeNull();
  });

  it("ApiError以外の例外は汎用メッセージにフォールバックする", async () => {
    vi.mocked(getRecipe).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useRecipe(1));

    await waitFor(() =>
      expect(result.current.error).toBe(
        "レシピの取得に失敗しました。時間をおいて再度お試しください。",
      ),
    );
  });
});
