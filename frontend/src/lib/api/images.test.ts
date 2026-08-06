import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./recipes";
import { uploadImage } from "./images";

describe("uploadImage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("POST /api/imagesにFormDataで送信し、成功時はurlを返す", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ url: "/api/uploads/xxxx.jpg" }), {
        status: 201,
      }),
    );
    const file = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });

    const result = await uploadImage(file);

    expect(fetch).toHaveBeenCalledWith(
      "/api/images",
      expect.objectContaining({ method: "POST" }),
    );
    const call = vi.mocked(fetch).mock.calls[0][1];
    expect(call?.body).toBeInstanceOf(FormData);
    expect((call?.body as FormData).get("file")).toBe(file);
    expect(result).toEqual({ url: "/api/uploads/xxxx.jpg" });
  });

  it("失敗時はレスポンスの内容を持つApiErrorをthrowする", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "VALIDATION_ERROR",
          message: "jpeg・png・webp形式の画像のみアップロードできます",
        }),
        { status: 400 },
      ),
    );
    const file = new File(["dummy"], "note.txt", { type: "text/plain" });

    await expect(uploadImage(file)).rejects.toMatchObject({
      status: 400,
      body: {
        error: "VALIDATION_ERROR",
        message: "jpeg・png・webp形式の画像のみアップロードできます",
      },
    } satisfies Partial<ApiError>);
  });
});
