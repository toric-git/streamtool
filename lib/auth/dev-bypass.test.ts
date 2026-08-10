import { describe, expect, it, afterEach, vi } from "vitest";
import { isDevAuthBypassEnabled } from "@/lib/auth/dev-bypass";

describe("isDevAuthBypassEnabled", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllEnvs();
  });

  it("is off by default", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_AUTH_BYPASS", "");
    delete process.env.VERCEL_ENV;
    expect(isDevAuthBypassEnabled()).toBe(false);
  });

  it("is on in development when flagged", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_AUTH_BYPASS", "1");
    delete process.env.VERCEL_ENV;
    expect(isDevAuthBypassEnabled()).toBe(true);
  });

  it("stays off in production even if flagged", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEV_AUTH_BYPASS", "1");
    expect(isDevAuthBypassEnabled()).toBe(false);
  });

  it("stays off on non-localhost hosts", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_AUTH_BYPASS", "1");
    delete process.env.VERCEL_ENV;
    const request = {
      nextUrl: { hostname: "example.com" },
    } as never;
    expect(isDevAuthBypassEnabled(request)).toBe(false);
  });
});
