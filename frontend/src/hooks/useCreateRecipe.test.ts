import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError, createRecipe } from "@/lib/api/recipes";
import { useCreateRecipe } from "./useCreateRecipe";

vi.mock("@/lib/api/recipes", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/recipes")>(
    "@/lib/api/recipes",
  );
  return { ...actual, createRecipe: vi.fn() };
});

const input = { title: "肉じゃが", url: "https://example.com", tags: [] };

describe("useCreateRecipe", () => {
  it("成功時はisSubmittingがfalseに戻りerrorはnullのまま", async () => {
    const recipe = {
      id: 1,
      title: "肉じゃが",
      url: "https://example.com",
      thumbnailUrl: null,
      memo: null,
      tags: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    vi.mocked(createRecipe).mockResolvedValue(recipe);

    const { result } = renderHook(() => useCreateRecipe());

    let returned;
    await act(async () => {
      returned = await result.current.submit(input);
    });

    expect(returned).toEqual(recipe);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("ApiErrorの場合はサーバーのメッセージをerrorに設定する", async () => {
    vi.mocked(createRecipe).mockRejectedValue(
      new ApiError(400, { error: "VALIDATION_ERROR", message: "titleは必須です" }),
    );

    const { result } = renderHook(() => useCreateRecipe());

    await act(async () => {
      await result.current.submit(input);
    });

    await waitFor(() => expect(result.current.error).toBe("titleは必須です"));
    expect(result.current.isSubmitting).toBe(false);
  });

  it("ApiError以外の例外は汎用メッセージにフォールバックする", async () => {
    vi.mocked(createRecipe).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useCreateRecipe());

    await act(async () => {
      await result.current.submit(input);
    });

    expect(result.current.error).toBe(
      "登録に失敗しました。時間をおいて再度お試しください。",
    );
  });
});
