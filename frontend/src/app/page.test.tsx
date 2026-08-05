import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRecipes } from "@/hooks/useRecipes";
import Home from "./page";

vi.mock("@/hooks/useRecipes");

describe("Home", () => {
  it("renders the app title", () => {
    vi.mocked(useRecipes).mockReturnValue({
      recipes: [],
      isLoading: true,
      error: null,
    });

    render(<Home />);
    expect(screen.getByText("RecipeManager")).toBeInTheDocument();
  });
});
