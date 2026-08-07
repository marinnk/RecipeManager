import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getRecipe } from "@/lib/api/recipes";
import RecipeDetailPage from "./page";

vi.mock("@/lib/api/recipes", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/recipes")>(
    "@/lib/api/recipes",
  );
  return { ...actual, getRecipe: vi.fn() };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("RecipeDetailPage", () => {
  it("レシピタイトルを見出しとして表示する", async () => {
    vi.mocked(getRecipe).mockResolvedValue({
      id: 1,
      title: "肉じゃが",
      url: "https://example.com",
      thumbnailUrl: null,
      memo: null,
      tags: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    });

    const page = await RecipeDetailPage({ params: Promise.resolve({ id: "1" }) });
    render(page);

    expect(
      await screen.findByRole("heading", { name: "肉じゃが" }),
    ).toBeInTheDocument();
  });
});
