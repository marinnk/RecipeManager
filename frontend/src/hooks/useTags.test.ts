import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/recipes";
import { getTags } from "@/lib/api/tags";
import { useTags } from "./useTags";

vi.mock("@/lib/api/tags", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/tags")>(
    "@/lib/api/tags",
  );
  return { ...actual, getTags: vi.fn() };
});

describe("useTags", () => {
  it("マウント時にタグ一覧を取得し、成功時はtagsにセットする", async () => {
    vi.mocked(getTags).mockResolvedValue(["和食", "時短"]);

    const { result } = renderHook(() => useTags());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tags).toEqual(["和食", "時短"]);
    expect(result.current.error).toBeNull();
  });

  it("ApiErrorの場合はサーバーのメッセージをerrorに設定する", async () => {
    vi.mocked(getTags).mockRejectedValue(
      new ApiError(500, { error: "INTERNAL_ERROR", message: "取得に失敗しました" }),
    );

    const { result } = renderHook(() => useTags());

    await waitFor(() => expect(result.current.error).toBe("取得に失敗しました"));
    expect(result.current.tags).toEqual([]);
  });

  it("ApiError以外の例外は汎用メッセージにフォールバックする", async () => {
    vi.mocked(getTags).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useTags());

    await waitFor(() =>
      expect(result.current.error).toBe(
        "タグ一覧の取得に失敗しました。時間をおいて再度お試しください。",
      ),
    );
  });
});
