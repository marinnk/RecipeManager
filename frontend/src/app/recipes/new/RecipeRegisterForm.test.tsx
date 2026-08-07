import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, createRecipe } from "@/lib/api/recipes";
import { uploadImage } from "@/lib/api/images";
import { fetchMetadata } from "@/lib/api/metadata";
import { RecipeRegisterForm } from "./RecipeRegisterForm";

vi.mock("@/lib/api/recipes", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/recipes")>(
    "@/lib/api/recipes",
  );
  return { ...actual, createRecipe: vi.fn() };
});

vi.mock("@/lib/api/images", () => ({
  uploadImage: vi.fn(),
}));

vi.mock("@/lib/api/metadata", () => ({
  fetchMetadata: vi.fn(),
}));

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
    vi.mocked(uploadImage).mockReset();
    vi.mocked(fetchMetadata).mockReset();
  });

  it("タグを追加・削除でき、送信すると入力内容でAPIを呼び出しトップに遷移する", async () => {
    const user = userEvent.setup();
    vi.mocked(createRecipe).mockResolvedValue(recipe);
    render(<RecipeRegisterForm />);

    await user.type(screen.getByLabelText("URL（任意）"), "https://example.com");
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

    expect(uploadImage).not.toHaveBeenCalled();
    expect(createRecipe).toHaveBeenCalledWith({
      title: "肉じゃが",
      url: "https://example.com",
      thumbnailUrl: undefined,
      memo: "美味しい",
      tags: ["簡単", "和食"],
    });
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("画像ファイルを選択して送信すると、先にアップロードしてそのURLで登録する", async () => {
    const user = userEvent.setup();
    vi.mocked(uploadImage).mockResolvedValue({ url: "/api/uploads/xxxx.jpg" });
    vi.mocked(createRecipe).mockResolvedValue(recipe);
    render(<RecipeRegisterForm />);

    await user.type(screen.getByLabelText("URL（任意）"), "https://example.com");
    await user.type(screen.getByLabelText("タイトル"), "肉じゃが");
    const file = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("サムネイル画像（任意）"), file);

    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(uploadImage).toHaveBeenCalledWith(file);
    expect(createRecipe).toHaveBeenCalledWith(
      expect.objectContaining({ thumbnailUrl: "/api/uploads/xxxx.jpg" }),
    );
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("画像アップロードが失敗した場合、レシピ登録は呼ばれずエラーが表示される", async () => {
    const user = userEvent.setup();
    vi.mocked(uploadImage).mockRejectedValue(
      new ApiError(400, {
        error: "VALIDATION_ERROR",
        message: "画像ファイルは8MB以下にしてください",
      }),
    );
    render(<RecipeRegisterForm />);

    await user.type(screen.getByLabelText("URL（任意）"), "https://example.com");
    await user.type(screen.getByLabelText("タイトル"), "肉じゃが");
    const file = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("サムネイル画像（任意）"), file);

    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "画像ファイルは8MB以下にしてください",
    );
    expect(createRecipe).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("サーバーのバリデーションエラーを表示し、遷移しない", async () => {
    const user = userEvent.setup();
    vi.mocked(createRecipe).mockRejectedValue(
      new ApiError(400, { error: "VALIDATION_ERROR", message: "titleは必須です" }),
    );
    render(<RecipeRegisterForm />);

    await user.type(screen.getByLabelText("URL（任意）"), "https://example.com");
    await user.type(screen.getByLabelText("タイトル"), "a");
    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "titleは必須です",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("URLを入力しなくても登録できる", async () => {
    const user = userEvent.setup();
    vi.mocked(createRecipe).mockResolvedValue({ ...recipe, url: null });
    render(<RecipeRegisterForm />);

    await user.type(screen.getByLabelText("タイトル"), "肉じゃが");
    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(createRecipe).toHaveBeenCalledWith(
      expect.objectContaining({ url: undefined }),
    );
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("自動取得ボタン押下でタイトル・サムネイルプレビューが反映される", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchMetadata).mockResolvedValue({
      title: "肉じゃがの作り方",
      thumbnailUrl: "https://i.ytimg.com/vi/xxxx/hqdefault.jpg",
    });
    const { container } = render(<RecipeRegisterForm />);

    await user.type(
      screen.getByLabelText("URL（任意）"),
      "https://www.youtube.com/watch?v=xxxx",
    );
    await user.click(screen.getByRole("button", { name: "自動取得" }));

    expect(fetchMetadata).toHaveBeenCalledWith(
      "https://www.youtube.com/watch?v=xxxx",
    );
    expect(await screen.findByLabelText("タイトル")).toHaveValue(
      "肉じゃがの作り方",
    );
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://i.ytimg.com/vi/xxxx/hqdefault.jpg",
    );
  });

  it("URL欄からフォーカスが外れると自動で取得する", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchMetadata).mockResolvedValue({
      title: "肉じゃがの作り方",
      thumbnailUrl: "https://i.ytimg.com/vi/xxxx/hqdefault.jpg",
    });
    render(<RecipeRegisterForm />);

    await user.type(
      screen.getByLabelText("URL（任意）"),
      "https://www.youtube.com/watch?v=xxxx",
    );
    await user.tab();

    expect(fetchMetadata).toHaveBeenCalledWith(
      "https://www.youtube.com/watch?v=xxxx",
    );
    expect(await screen.findByLabelText("タイトル")).toHaveValue(
      "肉じゃがの作り方",
    );
  });

  it("URL欄でEnterキーを押すと取得し、フォームは送信されない", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchMetadata).mockResolvedValue({
      title: "肉じゃがの作り方",
      thumbnailUrl: "https://i.ytimg.com/vi/xxxx/hqdefault.jpg",
    });
    render(<RecipeRegisterForm />);

    await user.type(
      screen.getByLabelText("URL（任意）"),
      "https://www.youtube.com/watch?v=xxxx{enter}",
    );

    expect(fetchMetadata).toHaveBeenCalledWith(
      "https://www.youtube.com/watch?v=xxxx",
    );
    expect(await screen.findByLabelText("タイトル")).toHaveValue(
      "肉じゃがの作り方",
    );
    expect(createRecipe).not.toHaveBeenCalled();
  });

  it("URLを変更せずにフォーカスが外れても再取得しない", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchMetadata).mockResolvedValue({
      title: "肉じゃがの作り方",
      thumbnailUrl: null,
    });
    render(<RecipeRegisterForm />);

    await user.type(
      screen.getByLabelText("URL（任意）"),
      "https://www.youtube.com/watch?v=xxxx",
    );
    await user.tab();
    await screen.findByDisplayValue("肉じゃがの作り方");

    await user.clear(screen.getByLabelText("タイトル"));
    await user.type(screen.getByLabelText("タイトル"), "自分でつけたタイトル");

    // URL欄をクリックして、変更せずにまたフォーカスを外す。
    await user.click(screen.getByLabelText("URL（任意）"));
    await user.tab();

    expect(fetchMetadata).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("タイトル")).toHaveValue("自分でつけたタイトル");
  });

  it("自動取得に失敗した場合はエラーメッセージを表示する", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchMetadata).mockRejectedValue(
      new ApiError(422, {
        error: "METADATA_FETCH_FAILED",
        message: "情報を取得できませんでした。手動で入力してください",
      }),
    );
    render(<RecipeRegisterForm />);

    await user.type(screen.getByLabelText("URL（任意）"), "https://example.com/unknown");
    await user.click(screen.getByRole("button", { name: "自動取得" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "情報を取得できませんでした。手動で入力してください",
    );
  });

  it("自動取得後に画像ファイルを選択すると、そちらのURLで登録される", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchMetadata).mockResolvedValue({
      title: "肉じゃがの作り方",
      thumbnailUrl: "https://i.ytimg.com/vi/xxxx/hqdefault.jpg",
    });
    vi.mocked(uploadImage).mockResolvedValue({ url: "/api/uploads/manual.jpg" });
    vi.mocked(createRecipe).mockResolvedValue(recipe);
    render(<RecipeRegisterForm />);

    await user.type(
      screen.getByLabelText("URL（任意）"),
      "https://www.youtube.com/watch?v=xxxx",
    );
    await user.click(screen.getByRole("button", { name: "自動取得" }));
    await screen.findByDisplayValue("肉じゃがの作り方");

    const file = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("サムネイル画像（任意）"), file);
    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(uploadImage).toHaveBeenCalledWith(file);
    expect(createRecipe).toHaveBeenCalledWith(
      expect.objectContaining({ thumbnailUrl: "/api/uploads/manual.jpg" }),
    );
  });

  it("キャンセルボタンでトップに遷移する", async () => {
    const user = userEvent.setup();
    render(<RecipeRegisterForm />);

    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(pushMock).toHaveBeenCalledWith("/");
    expect(createRecipe).not.toHaveBeenCalled();
  });
});
