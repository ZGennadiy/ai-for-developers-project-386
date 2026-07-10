import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ownerFixture } from "@/test/handlers";
import { App } from "./App";

describe("App", () => {
  it("renders the header with navigation to both sections", () => {
    render(<App />);
    expect(screen.getByText("Календарь бронирования")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Каталог" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Кабинет владельца" })).toBeInTheDocument();
  });

  it("shows the owner sub-navigation only within the owner section", async () => {
    render(<App />);
    expect(
      screen.queryByRole("link", { name: "Предстоящие встречи" })
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("link", { name: "Кабинет владельца" }));

    expect(
      await screen.findByRole("link", { name: "Предстоящие встречи" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Типы событий" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(new RegExp(ownerFixture.email))).toBeInTheDocument();
    });
  });
});
