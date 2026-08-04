import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NewRecipePage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("NewRecipePage", () => {
  it("見出しを表示する", () => {
    render(<NewRecipePage />);
    expect(
      screen.getByRole("heading", { name: "レシピを登録" }),
    ).toBeInTheDocument();
  });
});
