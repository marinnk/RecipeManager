import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError, updateRecipe } from "@/lib/api/recipes";
import { useUpdateRecipe } from "./useUpdateRecipe";

vi.mock("@/lib/api/recipes", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/recipes")>(
    "@/lib/api/recipes",
  );
  return { ...actual, updateRecipe: vi.fn() };
});

const input = { title: "肉じゃが", url: "https://example.com", tags: [] };

describe("useUpdateRecipe", () => {
  it("成功時はisSubmittingがfalseに戻りerrorはnullのまま", async () => {
    const recipe = {
      id: 1,
      title: "肉じゃが",
      url: "https://example.com",
      thumbnailUrl: null,
      memo: null,
      tags: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    };
    vi.mocked(updateRecipe).mockResolvedValue(recipe);

    const { result } = renderHook(() => useUpdateRecipe());

    let returned;
    await act(async () => {
      returned = await result.current.submit(1, input);
    });

    expect(updateRecipe).toHaveBeenCalledWith(1, input);
    expect(returned).toEqual(recipe);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("ApiErrorの場合はサーバーのメッセージをerrorに設定する", async () => {
    vi.mocked(updateRecipe).mockRejectedValue(
      new ApiError(400, { error: "VALIDATION_ERROR", message: "titleは必須です" }),
    );

    const { result } = renderHook(() => useUpdateRecipe());

    await act(async () => {
      await result.current.submit(1, input);
    });

    await waitFor(() => expect(result.current.error).toBe("titleは必須です"));
    expect(result.current.isSubmitting).toBe(false);
  });

  it("ApiError以外の例外は汎用メッセージにフォールバックする", async () => {
    vi.mocked(updateRecipe).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useUpdateRecipe());

    await act(async () => {
      await result.current.submit(1, input);
    });

    expect(result.current.error).toBe(
      "更新に失敗しました。時間をおいて再度お試しください。",
    );
  });
});
