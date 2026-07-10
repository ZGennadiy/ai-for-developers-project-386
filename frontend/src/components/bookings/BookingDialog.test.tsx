import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/render";
import { BookingDialog } from "./BookingDialog";

const slot = { start: "2026-07-10T09:00:00Z", end: "2026-07-10T09:30:00Z" };

describe("BookingDialog", () => {
  it("shows validation errors for empty name and invalid email", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingDialog eventTypeId="intro-call" slot={slot} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Подтвердить запись" }));

    expect(await screen.findByText("Укажите имя")).toBeInTheDocument();
    expect(await screen.findByText("Некорректный email")).toBeInTheDocument();
  });

  it("submits the booking and navigates to the confirmation page on success", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<BookingDialog eventTypeId="intro-call" slot={slot} onClose={onClose} />);

    await user.type(screen.getByLabelText("Имя"), "Иван Гость");
    await user.type(screen.getByLabelText("Email"), "ivan@example.com");
    await user.click(screen.getByRole("button", { name: "Подтвердить запись" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows a toast when the slot is already taken (409)", async () => {
    server.use(
      http.post("http://localhost:4010/bookings", () =>
        HttpResponse.json({ code: "slot_taken", message: "Время уже занято" }, { status: 409 })
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<BookingDialog eventTypeId="intro-call" slot={slot} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("Имя"), "Иван Гость");
    await user.type(screen.getByLabelText("Email"), "ivan@example.com");
    await user.click(screen.getByRole("button", { name: "Подтвердить запись" }));

    expect(await screen.findByText("Время уже занято")).toBeInTheDocument();
  });
});
