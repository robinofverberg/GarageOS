import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      create: mocks.userCreate,
    },
  },
}));

vi.mock("@/lib/password", () => ({
  hashPassword: mocks.hashPassword,
  verifyPassword: mocks.verifyPassword,
}));

vi.mock("@/lib/session", () => ({
  createSession: mocks.createSession,
  deleteSession: mocks.deleteSession,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

const { loginUser, registerUser } = await import("@/app/auth/actions");

function form(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

describe("auth server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates registration input before touching the database", async () => {
    const result = await registerUser({ error: null }, form({ email: "", password: "short" }));

    expect(result).toEqual({ error: "Email is required." });
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
  });

  it("normalizes email, creates a user, starts a session, and redirects", async () => {
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.hashPassword.mockResolvedValue("hashed-password");
    mocks.userCreate.mockResolvedValue({
      id: "user_1",
      email: "driver@example.com",
      name: "Driver",
    });

    await expect(
      registerUser(
        { error: null },
        form({ name: " Driver ", email: " DRIVER@EXAMPLE.COM ", password: "password123" })
      )
    ).rejects.toThrow("NEXT_REDIRECT:/garage");

    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { email: "driver@example.com" },
    });
    expect(mocks.userCreate).toHaveBeenCalledWith({
      data: {
        email: "driver@example.com",
        passwordHash: "hashed-password",
        name: "Driver",
      },
    });
    expect(mocks.createSession).toHaveBeenCalledWith({
      sub: "user_1",
      email: "driver@example.com",
      name: "Driver",
    });
  });

  it("returns a generic login error for bad credentials", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "user_1",
      email: "driver@example.com",
      passwordHash: "hashed-password",
      name: null,
    });
    mocks.verifyPassword.mockResolvedValue(false);

    await expect(
      loginUser({ error: null }, form({ email: "driver@example.com", password: "wrong" }))
    ).resolves.toEqual({ error: "Invalid email or password." });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });
});
