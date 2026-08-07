import type { ApiErrorBody, Recipe, RecipeInput } from "@/types/recipe";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody,
  ) {
    super(body.message);
  }
}

export type GetRecipesParams = {
  keyword?: string;
  tags?: string[];
};

export async function getRecipes(params?: GetRecipesParams): Promise<Recipe[]> {
  const query = new URLSearchParams();
  if (params?.keyword) {
    query.set("keyword", params.keyword);
  }
  // tagsは同名パラメータを繰り返す形式(?tags=a&tags=b)で送る。
  // バックエンドの@RequestParam tags: List<String>がこの形式をそのまま受け取れる。
  for (const tag of params?.tags ?? []) {
    query.append("tags", tag);
  }
  const queryString = query.toString();

  const res = await fetch(`/api/recipes${queryString ? `?${queryString}` : ""}`);

  if (!res.ok) {
    const body: ApiErrorBody = await res.json();
    throw new ApiError(res.status, body);
  }

  return res.json();
}

export async function createRecipe(input: RecipeInput): Promise<Recipe> {
  const res = await fetch("/api/recipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body: ApiErrorBody = await res.json();
    throw new ApiError(res.status, body);
  }

  return res.json();
}

export async function getRecipe(id: number): Promise<Recipe> {
  const res = await fetch(`/api/recipes/${id}`);

  if (!res.ok) {
    const body: ApiErrorBody = await res.json();
    throw new ApiError(res.status, body);
  }

  return res.json();
}

export async function updateRecipe(id: number, input: RecipeInput): Promise<Recipe> {
  const res = await fetch(`/api/recipes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body: ApiErrorBody = await res.json();
    throw new ApiError(res.status, body);
  }

  return res.json();
}

export async function deleteRecipe(id: number): Promise<void> {
  const res = await fetch(`/api/recipes/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const body: ApiErrorBody = await res.json();
    throw new ApiError(res.status, body);
  }
}
