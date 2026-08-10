/**
 * User-chosen display names are stored in auth user_metadata.display_name.
 * Google provides full_name / name — those must never be shown as the app name.
 */
export const PLACEHOLDER_DISPLAY_NAME = "ユーザー";

type AuthUserLike = {
  is_anonymous?: boolean | null;
  user_metadata?: Record<string, unknown> | null;
};

export function getChosenDisplayName(
  user: AuthUserLike | null | undefined,
): string | null {
  const raw = user?.user_metadata?.display_name;
  if (typeof raw !== "string") return null;
  const trimmed = raw.normalize("NFKC").trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** True when the user has not set an app display name yet (e.g. fresh Google login). */
export function needsDisplayNameSetup(
  user: AuthUserLike | null | undefined,
): boolean {
  if (!user) return false;
  if (user.is_anonymous) return false;
  return getChosenDisplayName(user) == null;
}
