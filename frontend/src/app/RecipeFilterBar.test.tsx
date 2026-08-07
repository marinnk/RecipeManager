import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RecipeFilterBar } from "./RecipeFilterBar";

describe("RecipeFilterBar", () => {
  it("キーワード入力欄に入力するとonKeywordChangeが呼ばれる", async () => {
    const user = userEvent.setup();
    const onKeywordChange = vi.fn();

    render(
      <RecipeFilterBar
        keyword=""
        onKeywordChange={onKeywordChange}
        availableTags={[]}
        selectedTags={[]}
        onToggleTag={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    await user.type(screen.getByLabelText("タイトルで検索"), "肉");

    expect(onKeywordChange).toHaveBeenCalledWith("肉");
  });

  it("タグチップをクリックするとonToggleTagが呼ばれる", async () => {
    const user = userEvent.setup();
    const onToggleTag = vi.fn();

    render(
      <RecipeFilterBar
        keyword=""
        onKeywordChange={vi.fn()}
        availableTags={["和食", "時短"]}
        selectedTags={[]}
        onToggleTag={onToggleTag}
        onClear={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "#和食" }));

    expect(onToggleTag).toHaveBeenCalledWith("和食");
  });

  it("選択中のタグはaria-pressed=trueになる", () => {
    render(
      <RecipeFilterBar
        keyword=""
        onKeywordChange={vi.fn()}
        availableTags={["和食", "時短"]}
        selectedTags={["和食"]}
        onToggleTag={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "#和食" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "#時短" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("キーワード・タグとも未指定のときはクリアボタンを表示しない", () => {
    render(
      <RecipeFilterBar
        keyword=""
        onKeywordChange={vi.fn()}
        availableTags={[]}
        selectedTags={[]}
        onToggleTag={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "条件をクリア" }),
    ).not.toBeInTheDocument();
  });

  it("絞り込み中はクリアボタンを表示し、クリックするとonClearが呼ばれる", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();

    render(
      <RecipeFilterBar
        keyword="肉じゃが"
        onKeywordChange={vi.fn()}
        availableTags={["和食"]}
        selectedTags={["和食"]}
        onToggleTag={vi.fn()}
        onClear={onClear}
      />,
    );
    await user.click(screen.getByRole("button", { name: "条件をクリア" }));

    expect(onClear).toHaveBeenCalled();
  });
});
