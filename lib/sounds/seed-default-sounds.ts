import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { STORAGE_BUCKETS } from "@/lib/app-config";
import { E } from "@/lib/errors/catalog";
import {
  DEFAULT_STREAM_CATEGORY,
  DEFAULT_STREAM_SOUNDS,
  estimateMp3DurationMs,
  type DefaultStreamSound,
} from "@/lib/sounds/default-stream-sounds";
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

const ASSETS_DIR = path.join(
  process.cwd(),
  "lib",
  "sounds",
  "default-assets",
);

export type SeedDefaultSoundsResult = {
  seeded: number;
  skippedExisting: number;
  failed: number;
  categoryId: string | null;
};

export type InsertPresetResult =
  | { ok: true; soundId: string; audioPath: string }
  | {
      ok: false;
      reason: "missing" | "upload" | "insert" | "empty";
      message?: string;
    };

/**
 * Upload one preset MP3 from default-assets and insert an approved sound row.
 */
export async function insertPresetSound(options: {
  admin: AdminClient;
  roomId: string;
  ownerId: string;
  preset: DefaultStreamSound;
  categoryId: string | null;
  sortOrder: number;
}): Promise<InsertPresetResult> {
  const { admin, roomId, ownerId, preset, categoryId, sortOrder } = options;

  const localPath = path.join(ASSETS_DIR, preset.file);
  let bytes: Buffer;
  try {
    bytes = await readFile(localPath);
  } catch (err) {
    console.error(
      "[sounds]",
      E.SOUND_SEED_ASSET_MISSING.code,
      preset.file,
      err,
    );
    return { ok: false, reason: "missing" };
  }

  if (bytes.byteLength === 0) {
    console.error("[sounds]", E.SOUND_SEED_ASSET_MISSING.code, preset.file);
    return { ok: false, reason: "empty" };
  }

  const audioPath = `${roomId}/${ownerId}/${randomUUID()}.mp3`;
  const { error: uploadError } = await admin.storage
    .from(STORAGE_BUCKETS.audio)
    .upload(audioPath, bytes, {
      contentType: "audio/mpeg",
      upsert: false,
    });

  if (uploadError) {
    console.error(
      "[sounds]",
      E.SOUND_SEED_UPLOAD_FAILED.code,
      preset.name,
      uploadError.message,
    );
    return { ok: false, reason: "upload", message: uploadError.message };
  }

  const { data, error: insertError } = await admin
    .from("sounds")
    .insert({
      room_id: roomId,
      uploader_id: ownerId,
      category_id: categoryId,
      name: preset.name,
      audio_path: audioPath,
      image_path: null,
      button_color: preset.buttonColor,
      text_color: preset.textColor ?? "#ffffff",
      volume: 1,
      cooldown_ms: preset.cooldownMs ?? 1000,
      duration_ms: estimateMp3DurationMs(bytes.byteLength),
      sort_order: sortOrder,
      approval_status: "approved",
      is_active: true,
    })
    .select("id")
    .single();

  if (insertError || !data?.id) {
    console.error(
      "[sounds]",
      E.SOUND_SEED_INSERT_FAILED.code,
      preset.name,
      insertError?.code,
      insertError?.message,
    );
    await admin.storage.from(STORAGE_BUCKETS.audio).remove([audioPath]);
    return { ok: false, reason: "insert", message: insertError?.message };
  }

  return { ok: true, soundId: data.id, audioPath };
}

/**
 * Upload curated stream SFX into room storage and insert approved sound rows.
 * Skips names that already exist in the room. Best-effort: partial success is OK.
 */
export async function seedDefaultSounds(options: {
  admin: AdminClient;
  roomId: string;
  ownerId: string;
}): Promise<SeedDefaultSoundsResult> {
  const { admin, roomId, ownerId } = options;

  const { data: existing } = await admin
    .from("sounds")
    .select("name")
    .eq("room_id", roomId);

  const existingNames = new Set((existing ?? []).map((s) => s.name));

  let categoryId: string | null = null;
  const { data: existingCategory } = await admin
    .from("sound_categories")
    .select("id")
    .eq("room_id", roomId)
    .eq("name", DEFAULT_STREAM_CATEGORY.name)
    .maybeSingle();

  if (existingCategory?.id) {
    categoryId = existingCategory.id;
  } else {
    const { data: createdCategory, error: categoryError } = await admin
      .from("sound_categories")
      .insert({
        room_id: roomId,
        name: DEFAULT_STREAM_CATEGORY.name,
        color: DEFAULT_STREAM_CATEGORY.color,
        sort_order: 0,
      })
      .select("id")
      .single();

    if (categoryError) {
      console.error(
        "[sounds]",
        E.CATEGORY_CREATE_FAILED.code,
        categoryError.code,
        categoryError.message,
      );
    } else {
      categoryId = createdCategory?.id ?? null;
    }
  }

  const { data: maxSort } = await admin
    .from("sounds")
    .select("sort_order")
    .eq("room_id", roomId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  let sortOrder = (maxSort?.sort_order ?? -1) + 1;
  let seeded = 0;
  let skippedExisting = 0;
  let failed = 0;

  for (const item of DEFAULT_STREAM_SOUNDS) {
    if (existingNames.has(item.name)) {
      skippedExisting += 1;
      continue;
    }

    const result = await insertPresetSound({
      admin,
      roomId,
      ownerId,
      preset: item,
      categoryId,
      sortOrder,
    });

    if (!result.ok) {
      failed += 1;
      continue;
    }

    existingNames.add(item.name);
    sortOrder += 1;
    seeded += 1;
  }

  return { seeded, skippedExisting, failed, categoryId };
}
