import { STORAGE_BUCKETS } from "@/lib/app-config";
import { E, type AppError, withMessage } from "@/lib/errors/catalog";
import { createClient } from "@/lib/supabase/server";
import {
  extensionMatchesFormat,
  inspectAudioHeader,
  inspectImageHeader,
} from "@/lib/validation/audio-headers";
import { getExtension } from "@/lib/validation/schemas";

const HEADER_BYTES = 256 * 1024; // enough for WAV fmt/data headers and magic

export async function verifyStoredAudio(options: {
  path: string;
  claimedDurationMs: number;
}): Promise<{ ok: true; durationMs: number } | { ok: false; error: AppError }> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.audio)
    .download(options.path);

  if (error || !data) {
    console.error(
      "[media]",
      E.MEDIA_AUDIO_VERIFY.code,
      error?.name,
      error?.message,
    );
    return { ok: false, error: E.MEDIA_AUDIO_VERIFY };
  }

  const buffer = new Uint8Array(await data.arrayBuffer());
  if (buffer.byteLength === 0) {
    return { ok: false, error: E.MEDIA_AUDIO_EMPTY };
  }

  const slice = buffer.slice(0, Math.min(buffer.byteLength, HEADER_BYTES));
  const inspected = inspectAudioHeader(slice);
  if (!inspected.ok) {
    return {
      ok: false,
      error: withMessage(E.VALIDATION, inspected.message),
    };
  }

  const ext = getExtension(options.path);
  if (!extensionMatchesFormat(ext, inspected.format)) {
    return {
      ok: false,
      error: withMessage(
        E.VALIDATION,
        "ファイル拡張子と実際の音声形式が一致しません。",
      ),
    };
  }

  const durationMs = inspected.durationMs ?? options.claimedDurationMs;
  if (!durationMs || durationMs <= 0 || durationMs > 30_000) {
    return {
      ok: false,
      error: withMessage(
        E.VALIDATION,
        "再生時間が不正です。30秒以下のファイルをアップロードしてください。",
      ),
    };
  }

  // If server could estimate duration, prefer it and reject large mismatch.
  if (
    inspected.durationMs != null &&
    Math.abs(inspected.durationMs - options.claimedDurationMs) > 1500
  ) {
    return {
      ok: false,
      error: withMessage(
        E.VALIDATION,
        "申告された再生時間とファイル内容が一致しません。別のファイルを試してください。",
      ),
    };
  }

  return { ok: true, durationMs };
}

export async function verifyStoredImage(options: {
  path: string;
}): Promise<{ ok: true } | { ok: false; error: AppError }> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.images)
    .download(options.path);

  if (error || !data) {
    console.error(
      "[media]",
      E.MEDIA_IMAGE_VERIFY.code,
      error?.name,
      error?.message,
    );
    return { ok: false, error: E.MEDIA_IMAGE_VERIFY };
  }

  const buffer = new Uint8Array(await data.arrayBuffer());
  const inspected = inspectImageHeader(buffer.slice(0, 64));
  if (!inspected.ok) {
    return {
      ok: false,
      error: withMessage(E.VALIDATION, inspected.message),
    };
  }

  const ext = getExtension(options.path);
  const okExt =
    (inspected.format === "jpeg" && (ext === "jpg" || ext === "jpeg")) ||
    (inspected.format === "png" && ext === "png") ||
    (inspected.format === "webp" && ext === "webp");

  if (!okExt) {
    return {
      ok: false,
      error: withMessage(
        E.VALIDATION,
        "ファイル拡張子と実際の画像形式が一致しません。",
      ),
    };
  }

  return { ok: true };
}
