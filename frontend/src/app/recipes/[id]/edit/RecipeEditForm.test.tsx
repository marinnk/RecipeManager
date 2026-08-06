import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, getRecipe, updateRecipe } from "@/lib/api/recipes";
import { uploadImage } from "@/lib/api/images";
import { RecipeEditForm } from "./RecipeEditForm";

vi.mock("@/lib/api/recipes", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/recipes")>(
    "@/lib/api/recipes",
  );
  return { ...actual, getRecipe: vi.fn(), updateRecipe: vi.fn() };
});

vi.mock("@/lib/api/images", () => ({
  uploadImage: vi.fn(),
}));

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const recipe = {
  id: 1,
  title: "肉じゃが",
  url: "https://example.com",
  thumbnailUrl: "/api/uploads/existing.jpg",
  memo: "美味しい",
  tags: ["和食", "簡単"],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("RecipeEditForm", () => {
  beforeEach(() => {
    pushMock.mockClear();
    vi.mocked(getRecipe).mockReset();
    vi.mocked(updateRecipe).mockReset();
    vi.mocked(uploadImage).mockReset();
  });

  it("既存のレシピ情報がフォームに初期表示される", async () => {
    vi.mocked(getRecipe).mockResolvedValue(recipe);
    const { container } = render(<RecipeEditForm recipeId={1} />);

    expect(await screen.findByLabelText("タイトル")).toHaveValue("肉じゃが");
    expect(screen.getByLabelText("URL")).toHaveValue("https://example.com");
    expect(screen.getByLabelText("メモ（任意）")).toHaveValue("美味しい");
    expect(screen.getByText("#和食")).toBeInTheDocument();
    expect(screen.getByText("#簡単")).toBeInTheDocument();
    // alt=""の画像はアクセシビリティツリー上decorative扱いとなりrole="img"で
    // 取得できないため、CSSセレクタで直接取得する。
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/api/uploads/existing.jpg",
    );
  });

  it("内容を変更して送信すると、既存の画像URLを維持したまま更新APIを呼び出しトップに遷移する", async () => {
    const user = userEvent.setup();
    vi.mocked(getRecipe).mockResolvedValue(recipe);
    vi.mocked(updateRecipe).mockResolvedValue({ ...recipe, title: "肉じゃが（改）" });
    render(<RecipeEditForm recipeId={1} />);

    await screen.findByLabelText("タイトル");
    await user.clear(screen.getByLabelText("タイトル"));
    await user.type(screen.getByLabelText("タイトル"), "肉じゃが（改）");
    await user.click(screen.getByRole("button", { name: "更新する" }));

    expect(uploadImage).not.toHaveBeenCalled();
    expect(updateRecipe).toHaveBeenCalledWith(1, {
      title: "肉じゃが（改）",
      url: "https://example.com",
      thumbnailUrl: "/api/uploads/existing.jpg",
      memo: "美味しい",
      tags: ["和食", "簡単"],
    });
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("新しい画像ファイルを選択して送信すると、先にアップロードしてそのURLで更新する", async () => {
    const user = userEvent.setup();
    vi.mocked(getRecipe).mockResolvedValue(recipe);
    vi.mocked(uploadImage).mockResolvedValue({ url: "/api/uploads/new.jpg" });
    vi.mocked(updateRecipe).mockResolvedValue(recipe);
    render(<RecipeEditForm recipeId={1} />);

    await screen.findByLabelText("タイトル");
    const file = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("サムネイル画像（任意）"), file);
    await user.click(screen.getByRole("button", { name: "更新する" }));

    expect(uploadImage).toHaveBeenCalledWith(file);
    expect(updateRecipe).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ thumbnailUrl: "/api/uploads/new.jpg" }),
    );
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("画像アップロードが失敗した場合、更新は呼ばれずエラーが表示される", async () => {
    const user = userEvent.setup();
    vi.mocked(getRecipe).mockResolvedValue(recipe);
    vi.mocked(uploadImage).mockRejectedValue(
      new ApiError(400, {
        error: "VALIDATION_ERROR",
        message: "画像ファイルは8MB以下にしてください",
      }),
    );
    render(<RecipeEditForm recipeId={1} />);

    await screen.findByLabelText("タイトル");
    const file = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("サムネイル画像（任意）"), file);
    await user.click(screen.getByRole("button", { name: "更新する" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "画像ファイルは8MB以下にしてください",
    );
    expect(updateRecipe).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("サーバーのバリデーションエラーを表示し、遷移しない", async () => {
    const user = userEvent.setup();
    vi.mocked(getRecipe).mockResolvedValue(recipe);
    vi.mocked(updateRecipe).mockRejectedValue(
      new ApiError(400, { error: "VALIDATION_ERROR", message: "titleは必須です" }),
    );
    render(<RecipeEditForm recipeId={1} />);

    await screen.findByLabelText("タイトル");
    await user.clear(screen.getByLabelText("タイトル"));
    await user.type(screen.getByLabelText("タイトル"), "a");
    await user.click(screen.getByRole("button", { name: "更新する" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "titleは必須です",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("キャンセルボタンでトップに遷移する", async () => {
    const user = userEvent.setup();
    vi.mocked(getRecipe).mockResolvedValue(recipe);
    render(<RecipeEditForm recipeId={1} />);

    await screen.findByLabelText("タイトル");
    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(pushMock).toHaveBeenCalledWith("/");
    expect(updateRecipe).not.toHaveBeenCalled();
  });

  it("レシピの取得に失敗した場合はエラーメッセージを表示する", async () => {
    vi.mocked(getRecipe).mockRejectedValue(
      new ApiError(404, { error: "NOT_FOUND", message: "id=1 のレシピが見つかりません" }),
    );
    render(<RecipeEditForm recipeId={1} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "id=1 のレシピが見つかりません",
    );
    expect(screen.queryByLabelText("タイトル")).not.toBeInTheDocument();
  });
});
