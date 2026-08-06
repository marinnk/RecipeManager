import type { ApiErrorBody, Recipe, RecipeInput } from "@/types/recipe";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody,
  ) {
    super(body.message);
  }
}

export async function getRecipes(): Promise<Recipe[]> {
  const res = await fetch("/api/recipes");

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
