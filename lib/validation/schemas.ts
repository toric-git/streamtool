import { z } from "zod";
import { AUDIO_LIMITS, IMAGE_LIMITS, ROOM_LIMITS } from "@/lib/app-config";

export const displayNameSchema = z
  .string()
  .transform((v) => v.normalize("NFKC").replace(/[\u0000-\u001F\u007F]/g, "").trim())
  .pipe(
    z
      .string()
      .min(ROOM_LIMITS.displayNameMin, "表示名を入力してください")
      .max(ROOM_LIMITS.displayNameMax, `表示名は${ROOM_LIMITS.displayNameMax}文字以内にしてください`),
  );

export const emailSchema = z
  .string()
  .trim()
  .email("有効なメールアドレスを入力してください");

export const passwordSchema = z
  .string()
  .min(8, "パスワードは8文字以上にしてください")
  .max(72, "パスワードが長すぎます");

export const roomNameSchema = z
  .string()
  .trim()
  .min(1, "部屋名を入力してください")
  .max(60, "部屋名は60文字以内にしてください");

export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6,8}$/, "ルームコードが正しくありません");

export const volumeSchema = z.number().min(0).max(1);

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "色は #RRGGBB 形式で指定してください");

export const soundNameSchema = z
  .string()
  .trim()
  .min(1, "サウンド名を入力してください")
  .max(40, "サウンド名は40文字以内にしてください");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

export const createRoomSchema = z.object({
  name: roomNameSchema,
  description: z.string().trim().max(500).optional().or(z.literal("")),
  password: z.string().min(4).max(72).optional().or(z.literal("")),
  guestEnabled: z.boolean().default(true),
  guestCanPlay: z.boolean().default(true),
  uploadEnabled: z.boolean().default(false),
  uploadRequiresApproval: z.boolean().default(true),
});

export const updateRoomSchema = z.object({
  name: roomNameSchema,
  description: z.string().trim().max(500).optional().or(z.literal("")),
  password: z.string().min(4).max(72).optional().or(z.literal("")),
  clearPassword: z.boolean().default(false),
  guestEnabled: z.boolean(),
  guestCanPlay: z.boolean(),
  uploadEnabled: z.boolean(),
  uploadRequiresApproval: z.boolean(),
  masterVolume: volumeSchema,
  obsVolume: volumeSchema,
  defaultCooldownMs: z.number().int().min(0).max(60_000),
  maxEventsPerMinute: z.number().int().min(1).max(600),
  maxSimultaneousSounds: z.number().int().min(1).max(32),
  maxMembers: z.number().int().min(2).max(200),
});

export const joinRoomSchema = z.object({
  roomCode: roomCodeSchema,
  password: z.string().max(72).optional().or(z.literal("")),
  displayName: displayNameSchema,
});

export function getExtension(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? (parts.at(-1) ?? "") : "";
}

export function validateAudioFileMeta(options: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  durationMs?: number | null;
}): { ok: true } | { ok: false; message: string } {
  const ext = getExtension(options.filename);
  if (!(AUDIO_LIMITS.allowedExtensions as readonly string[]).includes(ext)) {
    return {
      ok: false,
      message: `対応形式は ${AUDIO_LIMITS.allowedExtensions.join(", ").toUpperCase()} です`,
    };
  }

  const mimeOk = (AUDIO_LIMITS.allowedMimeTypes as readonly string[]).includes(
    options.mimeType.toLowerCase(),
  );
  // Some browsers report empty or application/octet-stream; still require extension.
  if (!mimeOk && options.mimeType && options.mimeType !== "application/octet-stream") {
    return { ok: false, message: "音声ファイルの形式が正しくありません" };
  }

  if (options.sizeBytes <= 0 || options.sizeBytes > AUDIO_LIMITS.maxBytes) {
    return {
      ok: false,
      message: `音声ファイルは ${(AUDIO_LIMITS.maxBytes / (1024 * 1024)).toFixed(0)}MB 以下にしてください`,
    };
  }

  if (
    options.durationMs != null &&
    (options.durationMs <= 0 || options.durationMs > AUDIO_LIMITS.maxDurationMs)
  ) {
    return {
      ok: false,
      message: `再生時間は ${AUDIO_LIMITS.maxDurationMs / 1000} 秒以下にしてください`,
    };
  }

  return { ok: true };
}

export function validateImageFileMeta(options: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}): { ok: true } | { ok: false; message: string } {
  const ext = getExtension(options.filename);
  if (!(IMAGE_LIMITS.allowedExtensions as readonly string[]).includes(ext)) {
    return {
      ok: false,
      message: `画像形式は ${IMAGE_LIMITS.allowedExtensions.join(", ").toUpperCase()} です`,
    };
  }

  const mimeOk = (IMAGE_LIMITS.allowedMimeTypes as readonly string[]).includes(
    options.mimeType.toLowerCase(),
  );
  if (!mimeOk && options.mimeType && options.mimeType !== "application/octet-stream") {
    return { ok: false, message: "画像ファイルの形式が正しくありません" };
  }

  if (options.sizeBytes <= 0 || options.sizeBytes > IMAGE_LIMITS.maxBytes) {
    return {
      ok: false,
      message: `画像は ${(IMAGE_LIMITS.maxBytes / (1024 * 1024)).toFixed(0)}MB 以下にしてください`,
    };
  }

  return { ok: true };
}
