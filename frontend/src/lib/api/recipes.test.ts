import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, createRecipe, getRecipe, getRecipes, updateRecipe } from "./recipes";

describe("getRecipes", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("GET /api/recipesを呼び出し、成功時はレシピの配列を返す", async () => {
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
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(recipes), { status: 200 }),
    );

    const result = await getRecipes();

    expect(fetch).toHaveBeenCalledWith("/api/recipes");
    expect(result).toEqual(recipes);
  });

  it("失敗時はレスポンスの内容を持つApiErrorをthrowする", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ error: "INTERNAL_ERROR", message: "取得に失敗しました" }),
        { status: 500 },
      ),
    );

    await expect(getRecipes()).rejects.toMatchObject({
      status: 500,
      body: { error: "INTERNAL_ERROR", message: "取得に失敗しました" },
    } satisfies Partial<ApiError>);
  });

  it("keywordを指定するとクエリパラメータに付与する", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));

    await getRecipes({ keyword: "肉じゃが" });

    expect(fetch).toHaveBeenCalledWith(
      `/api/recipes?keyword=${encodeURIComponent("肉じゃが")}`,
    );
  });

  it("tagsを指定すると同名パラメータを繰り返して付与する", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));

    await getRecipes({ tags: ["和食", "時短"] });

    expect(fetch).toHaveBeenCalledWith(
      `/api/recipes?tags=${encodeURIComponent("和食")}&tags=${encodeURIComponent("時短")}`,
    );
  });

  it("keywordとtagsを両方指定すると両方のパラメータを付与する", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));

    await getRecipes({ keyword: "肉じゃが", tags: ["和食"] });

    expect(fetch).toHaveBeenCalledWith(
      `/api/recipes?keyword=${encodeURIComponent("肉じゃが")}&tags=${encodeURIComponent("和食")}`,
    );
  });

  it("パラメータを指定しない場合は従来通りクエリ無しで呼び出す", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));

    await getRecipes();

    expect(fetch).toHaveBeenCalledWith("/api/recipes");
  });
});

describe("createRecipe", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("POST /api/recipesにJSONで送信し、成功時はレシピを返す", async () => {
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
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(recipe), { status: 201 }),
    );

    const result = await createRecipe({
      title: "肉じゃが",
      url: "https://example.com",
      tags: ["和食"],
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/recipes",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "肉じゃが",
          url: "https://example.com",
          tags: ["和食"],
        }),
      }),
    );
    expect(result).toEqual(recipe);
  });

  it("失敗時はレスポンスの内容を持つApiErrorをthrowする", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ error: "VALIDATION_ERROR", message: "titleは必須です" }),
        { status: 400 },
      ),
    );

    await expect(
      createRecipe({ title: "", url: "https://example.com", tags: [] }),
    ).rejects.toMatchObject({
      status: 400,
      body: { error: "VALIDATION_ERROR", message: "titleは必須です" },
    } satisfies Partial<ApiError>);
  });
});

describe("getRecipe", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("GET /api/recipes/{id}を呼び出し、成功時はレシピを返す", async () => {
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
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(recipe), { status: 200 }),
    );

    const result = await getRecipe(1);

    expect(fetch).toHaveBeenCalledWith("/api/recipes/1");
    expect(result).toEqual(recipe);
  });

  it("失敗時はレスポンスの内容を持つApiErrorをthrowする", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ error: "NOT_FOUND", message: "id=1 のレシピが見つかりません" }),
        { status: 404 },
      ),
    );

    await expect(getRecipe(1)).rejects.toMatchObject({
      status: 404,
      body: { error: "NOT_FOUND", message: "id=1 のレシピが見つかりません" },
    } satisfies Partial<ApiError>);
  });
});

describe("updateRecipe", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("PUT /api/recipes/{id}にJSONで送信し、成功時はレシピを返す", async () => {
    const recipe = {
      id: 1,
      title: "肉じゃが（改）",
      url: "https://example.com",
      thumbnailUrl: null,
      memo: null,
      tags: ["和食"],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(recipe), { status: 200 }),
    );

    const result = await updateRecipe(1, {
      title: "肉じゃが（改）",
      url: "https://example.com",
      tags: ["和食"],
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/recipes/1",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "肉じゃが（改）",
          url: "https://example.com",
          tags: ["和食"],
        }),
      }),
    );
    expect(result).toEqual(recipe);
  });

  it("失敗時はレスポンスの内容を持つApiErrorをthrowする", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ error: "VALIDATION_ERROR", message: "titleは必須です" }),
        { status: 400 },
      ),
    );

    await expect(
      updateRecipe(1, { title: "", url: "https://example.com", tags: [] }),
    ).rejects.toMatchObject({
      status: 400,
      body: { error: "VALIDATION_ERROR", message: "titleは必須です" },
    } satisfies Partial<ApiError>);
  });
});
