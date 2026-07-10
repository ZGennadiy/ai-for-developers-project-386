import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import { eventTypesFixture } from "@/test/handlers";
import { OwnerEventTypesPage } from "./OwnerEventTypesPage";

describe("OwnerEventTypesPage", () => {
  it("lists existing event types", async () => {
    renderWithProviders(<OwnerEventTypesPage />);
    await waitFor(() => {
      expect(screen.getByText(eventTypesFixture[0].name)).toBeInTheDocument();
    });
  });

  it("creates a new event type and shows a success toast", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OwnerEventTypesPage />);

    await user.type(screen.getByLabelText("Идентификатор"), "demo-call");
    await user.type(screen.getByLabelText("Название"), "Демо");
    await user.clear(screen.getByLabelText("Длительность (мин)"));
    await user.type(screen.getByLabelText("Длительность (мин)"), "45");
    await user.click(screen.getByRole("button", { name: "Создать" }));

    expect(await screen.findByText("Тип события создан")).toBeInTheDocument();
  });

  it("attaches a 409 conflict to the id field", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OwnerEventTypesPage />);

    await user.type(screen.getByLabelText("Идентификатор"), eventTypesFixture[0].id);
    await user.type(screen.getByLabelText("Название"), "Дубликат");
    await user.click(screen.getByRole("button", { name: "Создать" }));

    expect(
      await screen.findByText("Тип события с таким id уже существует")
    ).toBeInTheDocument();
  });
});
