import { describe, expect, it } from "vitest";
import { signJwt, verifyJwt } from "@/lib/jwt";

describe("jwt utilities", () => {
  it("round-trips a valid signed token", async () => {
    const token = await signJwt(
      {
        sub: "user_123",
        email: "driver@example.com",
        name: "Driver",
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      "secret"
    );

    await expect(verifyJwt(token, "secret")).resolves.toMatchObject({
      sub: "user_123",
      email: "driver@example.com",
      name: "Driver",
    });
  });

  it("rejects tampered or expired tokens", async () => {
    const expired = await signJwt(
      {
        sub: "user_123",
        email: "driver@example.com",
        name: null,
        exp: Math.floor(Date.now() / 1000) - 1,
      },
      "secret"
    );

    await expect(verifyJwt(`${expired.slice(0, -1)}x`, "secret")).resolves.toBeNull();
    await expect(verifyJwt(expired, "secret")).resolves.toBeNull();
  });
});
