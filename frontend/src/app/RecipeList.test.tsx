import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRecipes } from "@/hooks/useRecipes";
import { RecipeList } from "./RecipeList";

vi.mock("@/hooks/useRecipes");

describe("RecipeList", () => {
  it("読み込み中はローディング表示をする", () => {
    vi.mocked(useRecipes).mockReturnValue({
      recipes: [],
      isLoading: true,
      error: null,
    });

    render(<RecipeList />);

    expect(screen.getByText("読み込み中…")).toBeInTheDocument();
  });

  it("レシピがある場合はタイトルとタグを表示する", () => {
    vi.mocked(useRecipes).mockReturnValue({
      recipes: [
        {
          id: 1,
          title: "肉じゃが",
          url: "https://example.com",
          thumbnailUrl: null,
          memo: null,
          tags: ["和食", "煮物"],
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
      isLoading: false,
      error: null,
    });

    render(<RecipeList />);

    expect(screen.getByText("肉じゃが")).toBeInTheDocument();
    expect(screen.getByText("#和食")).toBeInTheDocument();
    expect(screen.getByText("#煮物")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "編集" })).toHaveAttribute(
      "href",
      "/recipes/1/edit",
    );
  });

  it("レシピが0件の場合は空状態を表示する", () => {
    vi.mocked(useRecipes).mockReturnValue({
      recipes: [],
      isLoading: false,
      error: null,
    });

    render(<RecipeList />);

    expect(
      screen.getByText("レシピがありません。まずは登録しましょう。"),
    ).toBeInTheDocument();
  });

  it("エラー時はエラーメッセージを表示する", () => {
    vi.mocked(useRecipes).mockReturnValue({
      recipes: [],
      isLoading: false,
      error: "取得に失敗しました",
    });

    render(<RecipeList />);

    expect(screen.getByRole("alert")).toHaveTextContent("取得に失敗しました");
  });
});
