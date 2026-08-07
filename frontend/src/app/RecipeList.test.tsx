import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDeleteRecipe } from "@/hooks/useDeleteRecipe";
import { useRecipes } from "@/hooks/useRecipes";
import { useTags } from "@/hooks/useTags";
import { RecipeList } from "./RecipeList";

vi.mock("@/hooks/useRecipes");
vi.mock("@/hooks/useDeleteRecipe");
vi.mock("@/hooks/useTags");

const refetchMock = vi.fn();
const deleteSubmitMock = vi.fn();

const recipe = {
  id: 1,
  title: "肉じゃが",
  url: "https://example.com",
  thumbnailUrl: null,
  memo: null,
  tags: ["和食", "煮物"],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("RecipeList", () => {
  beforeEach(() => {
    refetchMock.mockClear();
    deleteSubmitMock.mockClear();
    vi.mocked(useDeleteRecipe).mockReturnValue({
      submit: deleteSubmitMock,
      isSubmitting: false,
      error: null,
    });
    vi.mocked(useTags).mockReturnValue({ tags: [], isLoading: false, error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("読み込み中はローディング表示をする", () => {
    vi.mocked(useRecipes).mockReturnValue({
      recipes: [],
      isLoading: true,
      error: null,
      refetch: refetchMock,
    });

    render(<RecipeList />);

    expect(screen.getByText("読み込み中…")).toBeInTheDocument();
  });

  it("レシピがある場合はタイトルとタグを表示する", () => {
    vi.mocked(useRecipes).mockReturnValue({
      recipes: [recipe],
      isLoading: false,
      error: null,
      refetch: refetchMock,
    });

    render(<RecipeList />);

    expect(screen.getByText("肉じゃが")).toBeInTheDocument();
    expect(screen.getByText("#和食")).toBeInTheDocument();
    expect(screen.getByText("#煮物")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "肉じゃが" })).toHaveAttribute(
      "href",
      "/recipes/1",
    );
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
      refetch: refetchMock,
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
      refetch: refetchMock,
    });

    render(<RecipeList />);

    expect(screen.getByRole("alert")).toHaveTextContent("取得に失敗しました");
  });

  it("削除ボタン押下で確認ダイアログに同意すると削除APIを呼び出し一覧を再取得する", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    deleteSubmitMock.mockResolvedValue(true);
    vi.mocked(useRecipes).mockReturnValue({
      recipes: [recipe],
      isLoading: false,
      error: null,
      refetch: refetchMock,
    });

    render(<RecipeList />);
    await user.click(screen.getByRole("button", { name: "削除" }));

    expect(window.confirm).toHaveBeenCalledWith("「肉じゃが」を削除しますか？");
    expect(deleteSubmitMock).toHaveBeenCalledWith(1);
    expect(refetchMock).toHaveBeenCalled();
  });

  it("確認ダイアログでキャンセルすると削除APIは呼ばれない", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    vi.mocked(useRecipes).mockReturnValue({
      recipes: [recipe],
      isLoading: false,
      error: null,
      refetch: refetchMock,
    });

    render(<RecipeList />);
    await user.click(screen.getByRole("button", { name: "削除" }));

    expect(deleteSubmitMock).not.toHaveBeenCalled();
    expect(refetchMock).not.toHaveBeenCalled();
  });

  it("削除に失敗した場合はエラーメッセージを表示し再取得しない", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    deleteSubmitMock.mockResolvedValue(false);
    vi.mocked(useRecipes).mockReturnValue({
      recipes: [recipe],
      isLoading: false,
      error: null,
      refetch: refetchMock,
    });
    vi.mocked(useDeleteRecipe).mockReturnValue({
      submit: deleteSubmitMock,
      isSubmitting: false,
      error: "削除に失敗しました。時間をおいて再度お試しください。",
    });

    render(<RecipeList />);
    await user.click(screen.getByRole("button", { name: "削除" }));

    expect(
      await screen.findByText(
        "削除に失敗しました。時間をおいて再度お試しください。",
      ),
    ).toBeInTheDocument();
    expect(refetchMock).not.toHaveBeenCalled();
  });

  it("絞り込み条件が無く0件の場合と異なり、絞り込み中に0件だと専用メッセージを表示する", () => {
    vi.mocked(useTags).mockReturnValue({
      tags: ["和食"],
      isLoading: false,
      error: null,
    });
    vi.mocked(useRecipes).mockReturnValue({
      recipes: [],
      isLoading: false,
      error: null,
      refetch: refetchMock,
    });

    render(<RecipeList />);
    fireEvent.click(screen.getByRole("button", { name: "#和食" }));

    expect(
      screen.getByText("条件に一致するレシピが見つかりません。"),
    ).toBeInTheDocument();
  });

  it("useTagsで取得したタグをフィルターの選択肢として表示する", () => {
    vi.mocked(useTags).mockReturnValue({
      tags: ["和食", "時短"],
      isLoading: false,
      error: null,
    });
    vi.mocked(useRecipes).mockReturnValue({
      recipes: [],
      isLoading: false,
      error: null,
      refetch: refetchMock,
    });

    render(<RecipeList />);

    expect(screen.getByRole("button", { name: "#和食" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "#時短" })).toBeInTheDocument();
  });

  it("タグを選択するとuseRecipesにtagsとして渡す", () => {
    vi.mocked(useTags).mockReturnValue({
      tags: ["和食"],
      isLoading: false,
      error: null,
    });
    vi.mocked(useRecipes).mockReturnValue({
      recipes: [],
      isLoading: false,
      error: null,
      refetch: refetchMock,
    });

    render(<RecipeList />);
    fireEvent.click(screen.getByRole("button", { name: "#和食" }));

    expect(useRecipes).toHaveBeenLastCalledWith({ keyword: "", tags: ["和食"] });
  });

  it("条件をクリアするとキーワード・タグとも空でuseRecipesを呼ぶ", () => {
    vi.mocked(useTags).mockReturnValue({
      tags: ["和食"],
      isLoading: false,
      error: null,
    });
    vi.mocked(useRecipes).mockReturnValue({
      recipes: [],
      isLoading: false,
      error: null,
      refetch: refetchMock,
    });

    render(<RecipeList />);
    fireEvent.click(screen.getByRole("button", { name: "#和食" }));
    fireEvent.click(screen.getByRole("button", { name: "条件をクリア" }));

    expect(useRecipes).toHaveBeenLastCalledWith({ keyword: "", tags: [] });
  });

  it("キーワード入力は300ms経ってからuseRecipesに反映される", () => {
    vi.useFakeTimers();
    vi.mocked(useRecipes).mockReturnValue({
      recipes: [],
      isLoading: false,
      error: null,
      refetch: refetchMock,
    });

    render(<RecipeList />);
    fireEvent.change(screen.getByLabelText("タイトルで検索"), {
      target: { value: "肉じゃが" },
    });

    // 300ms経つ前はまだ反映されない
    expect(useRecipes).toHaveBeenLastCalledWith({ keyword: "", tags: [] });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(useRecipes).toHaveBeenLastCalledWith({ keyword: "肉じゃが", tags: [] });
  });
});
