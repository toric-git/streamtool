import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";

/** Comma-separated allowlist, e.g. `you@example.com,ops@vtuberplus.jp` */
export function getAppAdminEmails(): string[] {
  return (process.env.APP_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAppAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAppAdminEmails().includes(email.trim().toLowerCase());
}

export async function requireAppAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAppAdminEmail(user.email)) {
    return null;
  }
  return user;
}

export const FEEDBACK_LIMITS = {
  maxPerHour: 5,
  maxPerDay: 20,
} as const;

/**
 * Stable key for rate limiting. Prefer user id; otherwise hashed IP.
 * Raw IPs are not stored.
 */
export function feedbackClientKey(options: {
  userId: string | null;
  ip: string | null;
}): string {
  if (options.userId) {
    return `u:${options.userId}`;
  }
  const pepper =
    process.env.FEEDBACK_RATE_PEPPER?.trim() ||
    "feedback-rate";
  const ip = options.ip?.trim() || "unknown";
  const digest = createHash("sha256")
    .update(`${pepper}:feedback:${ip}`)
    .digest("hex")
    .slice(0, 32);
  return `ip:${digest}`;
}

export function clientIpFromHeaders(hdrs: Headers): string | null {
  const forwarded = hdrs.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return hdrs.get("x-real-ip")?.trim() || null;
}
