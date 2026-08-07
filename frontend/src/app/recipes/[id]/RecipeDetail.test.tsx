import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, deleteRecipe, getRecipe } from "@/lib/api/recipes";
import { RecipeDetail } from "./RecipeDetail";

vi.mock("@/lib/api/recipes", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/recipes")>(
    "@/lib/api/recipes",
  );
  return { ...actual, getRecipe: vi.fn(), deleteRecipe: vi.fn() };
});

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const recipe = {
  id: 1,
  title: "肉じゃが",
  url: "https://example.com/recipe",
  thumbnailUrl: "/api/uploads/existing.jpg",
  memo: "醤油を控えめにすると美味しい。\n次は圧力鍋で時短してみる。",
  tags: ["和食", "煮物"],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
};

describe("RecipeDetail", () => {
  beforeEach(() => {
    pushMock.mockClear();
    vi.mocked(getRecipe).mockReset();
    vi.mocked(deleteRecipe).mockReset();
  });

  it("レシピの情報を表示する", async () => {
    vi.mocked(getRecipe).mockResolvedValue(recipe);
    render(<RecipeDetail recipeId={1} />);

    expect(
      await screen.findByRole("heading", { name: "肉じゃが" }),
    ).toBeInTheDocument();
    expect(screen.getByText("#和食")).toBeInTheDocument();
    expect(screen.getByText("#煮物")).toBeInTheDocument();
    expect(screen.getByText(/登録日/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "元サイトを開く ↗" })).toHaveAttribute(
      "href",
      "https://example.com/recipe",
    );
    expect(screen.getByRole("link", { name: "編集する" })).toHaveAttribute(
      "href",
      "/recipes/1/edit",
    );
    expect(
      screen.getByText("醤油を控えめにすると美味しい。", { exact: false }),
    ).toBeInTheDocument();
  });

  it("メモが無い場合はメモ欄を表示しない", async () => {
    vi.mocked(getRecipe).mockResolvedValue({ ...recipe, memo: null });
    render(<RecipeDetail recipeId={1} />);

    await screen.findByRole("heading", { name: "肉じゃが" });
    expect(screen.queryByText("メモ")).not.toBeInTheDocument();
  });

  it("削除ボタン押下で確認ダイアログに同意すると削除APIを呼び出し一覧に遷移する", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(getRecipe).mockResolvedValue(recipe);
    vi.mocked(deleteRecipe).mockResolvedValue(undefined);
    render(<RecipeDetail recipeId={1} />);

    await screen.findByRole("heading", { name: "肉じゃが" });
    await user.click(screen.getByRole("button", { name: "削除する" }));

    expect(window.confirm).toHaveBeenCalledWith("「肉じゃが」を削除しますか？");
    expect(deleteRecipe).toHaveBeenCalledWith(1);
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("確認ダイアログでキャンセルすると削除APIは呼ばれない", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    vi.mocked(getRecipe).mockResolvedValue(recipe);
    render(<RecipeDetail recipeId={1} />);

    await screen.findByRole("heading", { name: "肉じゃが" });
    await user.click(screen.getByRole("button", { name: "削除する" }));

    expect(deleteRecipe).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("削除に失敗した場合はエラーメッセージを表示し遷移しない", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(getRecipe).mockResolvedValue(recipe);
    vi.mocked(deleteRecipe).mockRejectedValue(
      new ApiError(404, { error: "NOT_FOUND", message: "id=1 のレシピが見つかりません" }),
    );
    render(<RecipeDetail recipeId={1} />);

    await screen.findByRole("heading", { name: "肉じゃが" });
    await user.click(screen.getByRole("button", { name: "削除する" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "id=1 のレシピが見つかりません",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("レシピの取得に失敗した場合はエラーメッセージを表示する", async () => {
    vi.mocked(getRecipe).mockRejectedValue(
      new ApiError(404, { error: "NOT_FOUND", message: "id=1 のレシピが見つかりません" }),
    );
    render(<RecipeDetail recipeId={1} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "id=1 のレシピが見つかりません",
    );
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
