import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, createRecipe } from "@/lib/api/recipes";
import { RecipeRegisterForm } from "./RecipeRegisterForm";

vi.mock("@/lib/api/recipes", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/recipes")>(
    "@/lib/api/recipes",
  );
  return { ...actual, createRecipe: vi.fn() };
});

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const recipe = {
  id: 1,
  title: "肉じゃが",
  url: "https://example.com",
  thumbnailUrl: null,
  memo: null,
  tags: ["和食", "簡単"],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("RecipeRegisterForm", () => {
  beforeEach(() => {
    pushMock.mockClear();
    vi.mocked(createRecipe).mockReset();
  });

  it("タグを追加・削除でき、送信すると入力内容でAPIを呼び出しトップに遷移する", async () => {
    const user = userEvent.setup();
    vi.mocked(createRecipe).mockResolvedValue(recipe);
    render(<RecipeRegisterForm />);

    await user.type(screen.getByLabelText("URL"), "https://example.com");
    await user.type(screen.getByLabelText("タイトル"), "肉じゃが");
    await user.type(screen.getByLabelText("メモ（任意）"), "美味しい");

    const tagInput = screen.getByLabelText("タグ");
    await user.type(tagInput, "和食{enter}");
    await user.type(tagInput, "簡単{enter}");
    expect(screen.getByText("#和食")).toBeInTheDocument();
    expect(screen.getByText("#簡単")).toBeInTheDocument();

    await user.click(screen.getByLabelText("和食を削除"));
    expect(screen.queryByText("#和食")).not.toBeInTheDocument();

    await user.type(tagInput, "和食{enter}");
    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(createRecipe).toHaveBeenCalledWith({
      title: "肉じゃが",
      url: "https://example.com",
      thumbnailUrl: undefined,
      memo: "美味しい",
      tags: ["簡単", "和食"],
    });
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("サーバーのバリデーションエラーを表示し、遷移しない", async () => {
    const user = userEvent.setup();
    vi.mocked(createRecipe).mockRejectedValue(
      new ApiError(400, { error: "VALIDATION_ERROR", message: "titleは必須です" }),
    );
    render(<RecipeRegisterForm />);

    await user.type(screen.getByLabelText("URL"), "https://example.com");
    await user.type(screen.getByLabelText("タイトル"), "a");
    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "titleは必須です",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("キャンセルボタンでトップに遷移する", async () => {
    const user = userEvent.setup();
    render(<RecipeRegisterForm />);

    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(pushMock).toHaveBeenCalledWith("/");
    expect(createRecipe).not.toHaveBeenCalled();
  });
});
