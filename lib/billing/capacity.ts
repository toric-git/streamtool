/** Free plan: up to this many members (inclusive). 8+ requires paid. */
export const FREE_MAX_MEMBERS = 7;

/** Absolute hard cap (matches DB check). */
export const ABSOLUTE_MAX_MEMBERS = 200;

export const MIN_MEMBERS = 2;

/** Free-tier presets shown in create / owner settings. */
export const FREE_MEMBER_OPTIONS = [2, 3, 4, 5, 6, 7] as const;

/** Paid-tier presets (locked until entitlement). */
export const PAID_MEMBER_OPTIONS = [8, 12, 20, 30, 50, 100] as const;

/**
 * Paid room capacity allowlist (comma-separated emails), for ops / early access
 * until Stripe (or similar) is wired.
 */
export function getPaidCapacityEmails(): string[] {
  return (process.env.PAID_CAPACITY_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function hasPaidRoomCapacity(email: string | null | undefined): boolean {
  if (!email) return false;
  return getPaidCapacityEmails().includes(email.trim().toLowerCase());
}

export function maxMembersCap(paid: boolean): number {
  return paid ? ABSOLUTE_MAX_MEMBERS : FREE_MAX_MEMBERS;
}

export function requiresPaidCapacity(maxMembers: number): boolean {
  return maxMembers > FREE_MAX_MEMBERS;
}
