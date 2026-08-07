import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError, getRecipes } from "@/lib/api/recipes";
import { useRecipes } from "./useRecipes";

vi.mock("@/lib/api/recipes", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/recipes")>(
    "@/lib/api/recipes",
  );
  return { ...actual, getRecipes: vi.fn() };
});

describe("useRecipes", () => {
  it("マウント時に一覧を取得し、成功時はrecipesにセットする", async () => {
    const recipes = [
      {
        id: 1,
        title: "肉じゃが",
        url: "https://example.com",
        thumbnailUrl: null,
        memo: null,
        tags: ["和食"],
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];
    vi.mocked(getRecipes).mockResolvedValue(recipes);

    const { result } = renderHook(() => useRecipes());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.recipes).toEqual(recipes);
    expect(result.current.error).toBeNull();
  });

  it("ApiErrorの場合はサーバーのメッセージをerrorに設定する", async () => {
    vi.mocked(getRecipes).mockRejectedValue(
      new ApiError(500, { error: "INTERNAL_ERROR", message: "取得に失敗しました" }),
    );

    const { result } = renderHook(() => useRecipes());

    await waitFor(() => expect(result.current.error).toBe("取得に失敗しました"));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.recipes).toEqual([]);
  });

  it("ApiError以外の例外は汎用メッセージにフォールバックする", async () => {
    vi.mocked(getRecipes).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useRecipes());

    await waitFor(() =>
      expect(result.current.error).toBe(
        "レシピの取得に失敗しました。時間をおいて再度お試しください。",
      ),
    );
  });

  it("refetchを呼ぶと一覧を再取得する", async () => {
    vi.mocked(getRecipes).mockReset();
    vi.mocked(getRecipes).mockResolvedValue([]);

    const { result } = renderHook(() => useRecipes());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getRecipes).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(getRecipes).toHaveBeenCalledTimes(2));
  });
});
