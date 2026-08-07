import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError, deleteRecipe } from "@/lib/api/recipes";
import { useDeleteRecipe } from "./useDeleteRecipe";

vi.mock("@/lib/api/recipes", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/recipes")>(
    "@/lib/api/recipes",
  );
  return { ...actual, deleteRecipe: vi.fn() };
});

describe("useDeleteRecipe", () => {
  it("成功時はtrueを返し、isSubmittingがfalseに戻りerrorはnullのまま", async () => {
    vi.mocked(deleteRecipe).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteRecipe());

    let returned;
    await act(async () => {
      returned = await result.current.submit(1);
    });

    expect(returned).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("ApiErrorの場合はfalseを返しサーバーのメッセージをerrorに設定する", async () => {
    vi.mocked(deleteRecipe).mockRejectedValue(
      new ApiError(404, { error: "NOT_FOUND", message: "id=1 のレシピが見つかりません" }),
    );

    const { result } = renderHook(() => useDeleteRecipe());

    let returned;
    await act(async () => {
      returned = await result.current.submit(1);
    });

    expect(returned).toBe(false);
    await waitFor(() =>
      expect(result.current.error).toBe("id=1 のレシピが見つかりません"),
    );
    expect(result.current.isSubmitting).toBe(false);
  });

  it("ApiError以外の例外は汎用メッセージにフォールバックする", async () => {
    vi.mocked(deleteRecipe).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useDeleteRecipe());

    await act(async () => {
      await result.current.submit(1);
    });

    expect(result.current.error).toBe(
      "削除に失敗しました。時間をおいて再度お試しください。",
    );
  });
});
