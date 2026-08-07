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

  it("keyword/tagsを指定するとgetRecipesにそのまま渡す", async () => {
    vi.mocked(getRecipes).mockReset();
    vi.mocked(getRecipes).mockResolvedValue([]);

    renderHook(() => useRecipes({ keyword: "肉じゃが", tags: ["和食"] }));

    await waitFor(() =>
      expect(getRecipes).toHaveBeenCalledWith({ keyword: "肉じゃが", tags: ["和食"] }),
    );
  });

  it("keywordが変わると再取得する", async () => {
    vi.mocked(getRecipes).mockReset();
    vi.mocked(getRecipes).mockResolvedValue([]);

    const { rerender } = renderHook(
      ({ keyword }: { keyword: string }) => useRecipes({ keyword }),
      { initialProps: { keyword: "肉じゃが" } },
    );
    await waitFor(() => expect(getRecipes).toHaveBeenCalledTimes(1));

    rerender({ keyword: "カレー" });

    await waitFor(() => expect(getRecipes).toHaveBeenCalledTimes(2));
  });

  it("tagsの中身が同じなら配列の参照が変わっても再取得しない", async () => {
    vi.mocked(getRecipes).mockReset();
    vi.mocked(getRecipes).mockResolvedValue([]);

    const { rerender } = renderHook(
      ({ tags }: { tags: string[] }) => useRecipes({ tags }),
      { initialProps: { tags: ["和食"] } },
    );
    await waitFor(() => expect(getRecipes).toHaveBeenCalledTimes(1));

    rerender({ tags: ["和食"] }); // 中身は同じだが新しい配列インスタンス

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getRecipes).toHaveBeenCalledTimes(1);
  });
});
