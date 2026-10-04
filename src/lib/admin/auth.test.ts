import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));

const { isAdminToken, isDevBypass, requireAdmin } = await import("./auth");

describe("admin access", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts the admin claim or an allowlisted email (case-insensitive)", () => {
    vi.stubEnv("ADMIN_EMAILS", "owner@zstudios.co.za, Staff@ZStudios.co.za");
    expect(isAdminToken({ admin: true })).toBe(true);
    expect(isAdminToken({ email: "staff@zstudios.co.za" })).toBe(true);
    expect(isAdminToken({ email: "someone@else.com" })).toBe(false);
    expect(isAdminToken({ email: "owner@zstudios.co.za.evil.com" })).toBe(false);
    expect(isAdminToken({ admin: "true" })).toBe(false); // claim must be boolean true
  });

  it("dev bypass only in development without Firebase", () => {
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", "");
    vi.stubEnv("FIRESTORE_EMULATOR_HOST", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(isDevBypass()).toBe(true);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ZS_ALLOW_MEMORY_STORE", "1");
    expect(isDevBypass()).toBe(false);
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("FIRESTORE_EMULATOR_HOST", "127.0.0.1:8080");
    expect(isDevBypass()).toBe(false);
  });

  it("redirects to login when there is no session", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", "");
    vi.stubEnv("FIRESTORE_EMULATOR_HOST", "");
    await expect(requireAdmin()).rejects.toThrow("redirect:/admin/login");
  });
});
