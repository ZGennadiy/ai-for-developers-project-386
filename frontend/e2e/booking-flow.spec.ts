import { expect, test } from "@playwright/test";
import { uniqueSuffix } from "./support/unique-id";

test("guest books an available slot end-to-end", async ({ page }) => {
  const suffix = uniqueSuffix();
  const eventTypeId = `e2e-${suffix}`;
  const eventTypeName = `E2E Intro Call ${suffix}`;
  const guestName = `E2E Guest ${suffix}`;
  const guestEmail = `guest+${suffix}@example.com`;
  const note = "Созвон по поводу интеграции";

  await test.step("owner creates an event type", async () => {
    await page.goto("/owner/event-types");
    await expect(page.getByText("Новый тип события")).toBeVisible();

    await page.getByLabel("Идентификатор").fill(eventTypeId);
    await page.getByLabel("Название").fill(eventTypeName);
    await page.getByLabel("Описание").fill("Короткий вводный созвон");
    await page.getByLabel("Длительность (мин)").fill("30");
    await page.getByRole("button", { name: "Создать" }).click();

    await expect(page.getByText("Тип события создан")).toBeVisible();
    await expect(page.getByText(eventTypeName)).toBeVisible();
  });

  await test.step("guest sees the new event type in the catalog", async () => {
    await page.goto("/");
    await page.getByRole("link", { name: new RegExp(eventTypeName) }).click();
  });

  let slotTime = "";

  await test.step("guest opens the detail page and picks the first available slot", async () => {
    await expect(page.getByRole("heading", { name: eventTypeName })).toBeVisible();

    const firstSlot = page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first();
    await expect(firstSlot).toBeVisible();
    slotTime = (await firstSlot.textContent()) ?? "";
    expect(slotTime).not.toBe("");
    await firstSlot.click();
  });

  await test.step("guest fills and submits the booking dialog", async () => {
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Подтверждение записи")).toBeVisible();

    await dialog.getByLabel("Имя").fill(guestName);
    await dialog.getByLabel("Email").fill(guestEmail);
    await dialog.getByLabel("Заметка (необязательно)").fill(note);
    await dialog.getByRole("button", { name: "Подтвердить запись" }).click();
  });

  await test.step("guest lands on the confirmation page with correct details", async () => {
    await expect(page).toHaveURL(/\/bookings\/.+/);
    await expect(page.getByText("Бронь подтверждена")).toBeVisible();
    await expect(page.getByText(eventTypeName)).toBeVisible();
    await expect(page.getByText(new RegExp(`Гость: ${guestName}`))).toBeVisible();
    await expect(page.getByText(guestEmail, { exact: false })).toBeVisible();
    await expect(page.getByText(note)).toBeVisible();
    await expect(page.getByText(new RegExp(slotTime))).toBeVisible();
  });

  await test.step("owner sees the new booking in their upcoming bookings list", async () => {
    await page.goto("/owner");
    await expect(page.getByRole("cell", { name: guestName })).toBeVisible();
    await expect(page.getByRole("cell", { name: eventTypeName })).toBeVisible();
  });
});
