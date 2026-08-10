"use server";

import { revalidatePath } from "next/cache";
import { STORAGE_BUCKETS } from "@/lib/app-config";
import {
  actionFail,
  actionFailFrom,
  actionOk,
  type ActionResult,
} from "@/lib/actions/result";
import { E, withMessage } from "@/lib/errors/catalog";
import { verifyStoredAudio, verifyStoredImage } from "@/lib/media/verify-stored";
import { isOwnerOrAdmin } from "@/lib/permissions/room-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSessionUser,
  requireRoomActor,
} from "@/lib/supabase/auth-context";
import {
  hexColorSchema,
  soundNameSchema,
  volumeSchema,
} from "@/lib/validation/schemas";
import { z } from "zod";

const createSoundSchema = z.object({
  roomId: z.string().uuid(),
  name: soundNameSchema,
  audioPath: z.string().min(1),
  imagePath: z.string().min(1).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  buttonColor: hexColorSchema.default("#ff6b9d"),
  textColor: hexColorSchema.default("#ffffff"),
  volume: volumeSchema.default(1),
  cooldownMs: z.number().int().min(0).max(60_000).default(1000),
  durationMs: z.number().int().positive().max(30_000),
});

function revalidateSounds(roomId: string) {
  revalidatePath(`/rooms/${roomId}`);
  revalidatePath(`/rooms/${roomId}/sounds`);
}

export async function createSound(
  input: z.infer<typeof createSoundSchema>,
): Promise<ActionResult<{ soundId: string }>> {
  const parsed = createSoundSchema.safeParse(input);
  if (!parsed.success) {
    return actionFail(
      withMessage(
        E.VALIDATION,
        parsed.error.issues[0]?.message ?? E.VALIDATION.message,
      ),
    );
  }

  const actor = await requireRoomActor(parsed.data.roomId);
  if (!actor.ok) return actionFailFrom(actor);

  const { data: room } = await actor.supabase
    .from("rooms")
    .select("upload_enabled, default_cooldown_ms")
    .eq("id", parsed.data.roomId)
    .maybeSingle();

  if (!room) return actionFail(E.ROOM_NOT_FOUND);

  const adminRole = isOwnerOrAdmin(actor.membership.role);
  if (!adminRole && (!room.upload_enabled || !actor.membership.can_upload)) {
    return actionFail(E.SOUND_UPLOAD_DISABLED);
  }

  if (!parsed.data.audioPath.startsWith(`${parsed.data.roomId}/`)) {
    return actionFail(E.SOUND_AUDIO_PATH_INVALID);
  }

  const audioVerify = await verifyStoredAudio({
    path: parsed.data.audioPath,
    claimedDurationMs: parsed.data.durationMs,
  });
  if (!audioVerify.ok) return actionFail(audioVerify.error);

  if (parsed.data.imagePath) {
    if (!parsed.data.imagePath.startsWith(`${parsed.data.roomId}/`)) {
      return actionFail(E.SOUND_IMAGE_PATH_INVALID);
    }
    const imageVerify = await verifyStoredImage({ path: parsed.data.imagePath });
    if (!imageVerify.ok) return actionFail(imageVerify.error);
  }

  const { data: maxSort } = await actor.supabase
    .from("sounds")
    .select("sort_order")
    .eq("room_id", parsed.data.roomId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await actor.supabase
    .from("sounds")
    .insert({
      room_id: parsed.data.roomId,
      uploader_id: actor.user.id,
      category_id: parsed.data.categoryId ?? null,
      name: parsed.data.name,
      audio_path: parsed.data.audioPath,
      image_path: parsed.data.imagePath ?? null,
      button_color: parsed.data.buttonColor,
      text_color: parsed.data.textColor,
      volume: parsed.data.volume,
      cooldown_ms: parsed.data.cooldownMs || room.default_cooldown_ms,
      duration_ms: audioVerify.durationMs,
      sort_order: (maxSort?.sort_order ?? -1) + 1,
      approval_status: "approved",
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error(
      "[sounds]",
      E.SOUND_CREATE_FAILED.code,
      error?.code,
      error?.message,
    );
    return actionFail(E.SOUND_CREATE_FAILED);
  }

  revalidateSounds(parsed.data.roomId);
  return actionOk({ soundId: data.id });
}

export async function updateSoundVolume(
  soundId: string,
  volume: number,
): Promise<ActionResult> {
  const parsed = volumeSchema.safeParse(volume);
  if (!parsed.success) {
    return actionFail(
      withMessage(
        E.VALIDATION,
        parsed.error.issues[0]?.message ?? "音量は 0〜1 で指定してください。",
      ),
    );
  }

  const { supabase, user } = await getSessionUser();
  if (!user) return actionFail(E.AUTH_REQUIRED);

  const { data: sound } = await supabase
    .from("sounds")
    .select("id, room_id")
    .eq("id", soundId)
    .maybeSingle();

  if (!sound) return actionFail(E.SOUND_NOT_FOUND);

  const actor = await requireRoomActor(sound.room_id);
  if (!actor.ok) return actionFailFrom(actor);
  if (!isOwnerOrAdmin(actor.membership.role)) {
    return actionFail(E.SOUND_EDIT_FORBIDDEN);
  }

  const { error } = await supabase
    .from("sounds")
    .update({ volume: parsed.data })
    .eq("id", soundId);

  if (error) {
    console.error(
      "[sounds]",
      E.SOUND_UPDATE_FAILED.code,
      error.code,
      error.message,
    );
    return actionFail(E.SOUND_UPDATE_FAILED);
  }

  revalidateSounds(sound.room_id);
  return actionOk();
}

export async function deleteSound(soundId: string): Promise<ActionResult> {
  const { supabase, user } = await getSessionUser();
  if (!user) return actionFail(E.AUTH_REQUIRED);

  const { data: sound } = await supabase
    .from("sounds")
    .select("id, room_id, audio_path, image_path")
    .eq("id", soundId)
    .maybeSingle();

  if (!sound) return actionFail(E.SOUND_NOT_FOUND);

  const actor = await requireRoomActor(sound.room_id);
  if (!actor.ok) return actionFailFrom(actor);

  if (!isOwnerOrAdmin(actor.membership.role)) {
    return actionFail(E.SOUND_DELETE_FORBIDDEN);
  }

  const { error } = await supabase.from("sounds").delete().eq("id", soundId);
  if (error) {
    console.error(
      "[sounds]",
      E.SOUND_DELETE_FAILED.code,
      error.code,
      error.message,
    );
    return actionFail(E.SOUND_DELETE_FAILED);
  }

  try {
    const admin = createAdminClient();
    const removals: PromiseLike<unknown>[] = [
      admin.storage.from(STORAGE_BUCKETS.audio).remove([sound.audio_path]),
    ];
    if (sound.image_path) {
      removals.push(
        admin.storage.from(STORAGE_BUCKETS.images).remove([sound.image_path]),
      );
    }
    await Promise.all(removals);
  } catch (err) {
    console.error(
      "[sounds]",
      E.SOUND_STORAGE_CLEANUP.code,
      err instanceof Error ? err.name : "unknown",
    );
    revalidatePath(`/rooms/${sound.room_id}/sounds`);
    return actionFail(E.SOUND_STORAGE_CLEANUP);
  }

  revalidateSounds(sound.room_id);
  return actionOk();
}
