import type { NextRequest } from "next/server";

/**
 * Local-only auth bypass. Never active in production / Vercel preview.
 * Enable with DEV_AUTH_BYPASS=1 in .env.local.
 */
export function isDevAuthBypassEnabled(request?: NextRequest): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.VERCEL_ENV === "preview") return false;

  const flag = process.env.DEV_AUTH_BYPASS?.trim().toLowerCase();
  if (flag !== "1" && flag !== "true") return false;

  if (request) {
    const host = request.nextUrl.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") return false;
  }

  return true;
}

export function getDevAuthCredentials() {
  return {
    email: process.env.DEV_AUTH_EMAIL?.trim() || "dev@example.com",
    password: process.env.DEV_AUTH_PASSWORD?.trim() || "dev-local-password",
    displayName: process.env.DEV_AUTH_DISPLAY_NAME?.trim() || "開発ユーザー",
  };
}
