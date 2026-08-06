import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/recipes";
import { uploadImage } from "@/lib/api/images";
import { useUploadImage } from "./useUploadImage";

vi.mock("@/lib/api/images", () => ({
  uploadImage: vi.fn(),
}));

const file = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });

describe("useUploadImage", () => {
  it("成功時はisUploadingがfalseに戻りerrorはnullのまま", async () => {
    vi.mocked(uploadImage).mockResolvedValue({ url: "/api/uploads/xxxx.jpg" });

    const { result } = renderHook(() => useUploadImage());

    let returned;
    await act(async () => {
      returned = await result.current.submit(file);
    });

    expect(returned).toEqual({ url: "/api/uploads/xxxx.jpg" });
    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("ApiErrorの場合はサーバーのメッセージをerrorに設定する", async () => {
    vi.mocked(uploadImage).mockRejectedValue(
      new ApiError(400, {
        error: "VALIDATION_ERROR",
        message: "jpeg・png・webp形式の画像のみアップロードできます",
      }),
    );

    const { result } = renderHook(() => useUploadImage());

    await act(async () => {
      await result.current.submit(file);
    });

    expect(result.current.error).toBe(
      "jpeg・png・webp形式の画像のみアップロードできます",
    );
    expect(result.current.isUploading).toBe(false);
  });

  it("ApiError以外の例外は汎用メッセージにフォールバックする", async () => {
    vi.mocked(uploadImage).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useUploadImage());

    await act(async () => {
      await result.current.submit(file);
    });

    expect(result.current.error).toBe(
      "画像のアップロードに失敗しました。時間をおいて再度お試しください。",
    );
  });
});
