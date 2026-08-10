import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { STORAGE_BUCKETS } from "@/lib/app-config";
import { E } from "@/lib/errors/catalog";
import {
  DEFAULT_STREAM_CATEGORY,
  DEFAULT_STREAM_SOUNDS,
  estimateMp3DurationMs,
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

    const localPath = path.join(ASSETS_DIR, item.file);
    let bytes: Buffer;
    try {
      bytes = await readFile(localPath);
    } catch (err) {
      console.error(
        "[sounds]",
        E.SOUND_SEED_ASSET_MISSING.code,
        item.file,
        err,
      );
      failed += 1;
      continue;
    }

    if (bytes.byteLength === 0) {
      console.error("[sounds]", E.SOUND_SEED_ASSET_MISSING.code, item.file);
      failed += 1;
      continue;
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
        item.name,
        uploadError.message,
      );
      failed += 1;
      continue;
    }

    const { error: insertError } = await admin.from("sounds").insert({
      room_id: roomId,
      uploader_id: ownerId,
      category_id: categoryId,
      name: item.name,
      audio_path: audioPath,
      image_path: null,
      button_color: item.buttonColor,
      text_color: item.textColor ?? "#ffffff",
      volume: 1,
      cooldown_ms: item.cooldownMs ?? 1000,
      duration_ms: estimateMp3DurationMs(bytes.byteLength),
      sort_order: sortOrder,
      approval_status: "approved",
      is_active: true,
    });

    if (insertError) {
      console.error(
        "[sounds]",
        E.SOUND_SEED_INSERT_FAILED.code,
        item.name,
        insertError.code,
        insertError.message,
      );
      await admin.storage.from(STORAGE_BUCKETS.audio).remove([audioPath]);
      failed += 1;
      continue;
    }

    existingNames.add(item.name);
    sortOrder += 1;
    seeded += 1;
  }

  return { seeded, skippedExisting, failed, categoryId };
}
