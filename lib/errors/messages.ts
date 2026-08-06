import { E, type AppError, withMessage } from "@/lib/errors/catalog";

export function mapAuthError(message: string): AppError {
  const lower = message.toLowerCase();
  if (
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("certificate") ||
    lower.includes("ssl") ||
    lower.includes("tls") ||
    lower.includes("retryable") ||
    lower.includes("unable to verify") ||
    lower.includes("enotfound") ||
    lower.includes("econnreset")
  ) {
    return E.AUTH_CONNECTION;
  }
  if (lower.includes("email_address_invalid") || lower.includes("email address")) {
    return E.AUTH_EMAIL_INVALID;
  }
  if (lower.includes("invalid login") || lower.includes("invalid_credentials")) {
    return E.AUTH_INVALID_CREDENTIALS;
  }
  if (
    lower.includes("already registered") ||
    lower.includes("already been registered") ||
    lower.includes("user_already_exists")
  ) {
    return E.AUTH_ALREADY_REGISTERED;
  }
  if (lower.includes("email not confirmed") || lower.includes("email_not_confirmed")) {
    return E.AUTH_EMAIL_NOT_CONFIRMED;
  }
  if (lower.includes("provider is not enabled") || lower.includes("validation_failed")) {
    return E.AUTH_PROVIDER_DISABLED;
  }
  if (lower.includes("rate limit") || lower.includes("over_request")) {
    return E.AUTH_RATE_LIMIT;
  }
  return E.AUTH_FAILED;
}

export function mapRoomJoinError(message: string): AppError {
  const lower = message.toLowerCase();
  if (lower.includes("room not found") || lower.includes("p0002")) {
    return withMessage(E.ROOM_JOIN_INVALID_CODE, "部屋が見つかりません。ルームコードを確認してください。");
  }
  if (lower.includes("password")) {
    return withMessage(
      E.ROOM_JOIN_PASSWORD_WRONG,
      "参加パスワードが違うか、パスワード付きの部屋です。",
    );
  }
  if (lower.includes("full")) {
    return E.ROOM_JOIN_FULL;
  }
  if (lower.includes("guest")) {
    return E.ROOM_JOIN_GUEST_DISABLED;
  }
  if (lower.includes("not authenticated")) {
    return E.ROOM_JOIN_NOT_AUTHENTICATED;
  }
  return E.ROOM_JOIN_FAILED;
}

export function mapMemberError(message: string): AppError {
  const lower = message.toLowerCase();
  if (lower.includes("permission denied")) {
    return E.MEMBER_PERMISSION;
  }
  if (lower.includes("cannot kick owner") || lower.includes("cannot change owner")) {
    return E.MEMBER_OWNER_PROTECTED;
  }
  if (lower.includes("cannot kick yourself") || lower.includes("cannot change own")) {
    return E.MEMBER_SELF_FORBIDDEN;
  }
  if (lower.includes("member not found")) {
    return E.MEMBER_NOT_FOUND;
  }
  if (lower.includes("invalid role")) {
    return E.MEMBER_INVALID_ROLE;
  }
  if (lower.includes("guest")) {
    return E.MEMBER_GUEST_TRANSFER;
  }
  if (lower.includes("already owner")) {
    return E.MEMBER_ALREADY_OWNER;
  }
  return E.MEMBER_FAILED;
}

export function mapPlaybackError(message: string): AppError {
  const lower = message.toLowerCase();
  if (lower.includes("cooldown")) {
    return E.PLAY_COOLDOWN;
  }
  if (lower.includes("rate limit")) {
    return E.PLAY_RATE_LIMIT;
  }
  if (lower.includes("denied") || lower.includes("permission")) {
    return E.PLAY_DENIED;
  }
  return E.PLAY_FAILED;
}

export function mapRoomPageError(
  code: string | undefined,
): AppError | null {
  if (!code) return null;
  if (code === "owner_leave") return E.ROOM_OWNER_LEAVE;
  if (code === "leave_failed") return E.ROOM_LEAVE_FAILED;
  return withMessage(E.UNKNOWN, "操作に失敗しました。");
}
