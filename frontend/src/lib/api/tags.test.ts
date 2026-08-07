import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./recipes";
import { getTags } from "./tags";

describe("getTags", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("GET /api/tagsを呼び出し、成功時はタグ名の配列を返す", async () => {
    const tags = ["和食", "時短"];
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(tags), { status: 200 }));

    const result = await getTags();

    expect(fetch).toHaveBeenCalledWith("/api/tags");
    expect(result).toEqual(tags);
  });

  it("失敗時はレスポンスの内容を持つApiErrorをthrowする", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ error: "INTERNAL_ERROR", message: "取得に失敗しました" }),
        { status: 500 },
      ),
    );

    await expect(getTags()).rejects.toMatchObject({
      status: 500,
      body: { error: "INTERNAL_ERROR", message: "取得に失敗しました" },
    } satisfies Partial<ApiError>);
  });
});
