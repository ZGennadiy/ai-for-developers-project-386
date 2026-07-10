import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("renders the header with navigation to both sections", () => {
    render(<App />);
    expect(screen.getByText("Календарь бронирования")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Каталог" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Кабинет владельца" })).toBeInTheDocument();
  });
});
