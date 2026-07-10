import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { ownerFixture } from "@/test/handlers";
import { getOwner } from "./owner";

describe("getOwner", () => {
  it("returns the owner from the response envelope", async () => {
    const owner = await getOwner();
    expect(owner).toEqual(ownerFixture);
  });

  it("propagates a 404 as ApiError", async () => {
    server.use(
      http.get("http://localhost:4010/owner", () =>
        HttpResponse.json({ code: "owner_not_found", message: "Владелец не найден" }, { status: 404 })
      )
    );
    await expect(getOwner()).rejects.toMatchObject({ code: "owner_not_found" });
  });
});
