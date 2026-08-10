"use server";

import {
  actionFail,
  actionFailFrom,
  actionOk,
  type ActionResult,
} from "@/lib/actions/result";
import { E } from "@/lib/errors/catalog";
import { requireRoomActor } from "@/lib/supabase/auth-context";

export async function listFavoriteSoundIds(
  roomId: string,
): Promise<ActionResult<{ soundIds: string[] }>> {
  const actor = await requireRoomActor(roomId);
  if (!actor.ok) return actionFailFrom(actor);

  const { data, error } = await actor.supabase
    .from("sound_favorites")
    .select("sound_id")
    .eq("room_id", roomId)
    .eq("user_id", actor.user.id);

  if (error) {
    console.error("[favorites]", E.UNKNOWN.code, error.code, error.message);
    return actionFail(E.UNKNOWN);
  }

  return actionOk({
    soundIds: (data ?? []).map((row) => row.sound_id),
  });
}

export async function toggleFavoriteSound(
  roomId: string,
  soundId: string,
): Promise<ActionResult<{ favorite: boolean }>> {
  const actor = await requireRoomActor(roomId);
  if (!actor.ok) return actionFailFrom(actor);

  const { data: existing } = await actor.supabase
    .from("sound_favorites")
    .select("sound_id")
    .eq("user_id", actor.user.id)
    .eq("sound_id", soundId)
    .maybeSingle();

  if (existing) {
    const { error } = await actor.supabase
      .from("sound_favorites")
      .delete()
      .eq("user_id", actor.user.id)
      .eq("sound_id", soundId);
    if (error) {
      console.error("[favorites]", E.UNKNOWN.code, error.code, error.message);
      return actionFail(E.UNKNOWN);
    }
    return actionOk({ favorite: false });
  }

  const { data: sound } = await actor.supabase
    .from("sounds")
    .select("id")
    .eq("id", soundId)
    .eq("room_id", roomId)
    .maybeSingle();
  if (!sound) return actionFail(E.SOUND_NOT_FOUND);

  const { error } = await actor.supabase.from("sound_favorites").insert({
    user_id: actor.user.id,
    room_id: roomId,
    sound_id: soundId,
  });
  if (error) {
    console.error("[favorites]", E.UNKNOWN.code, error.code, error.message);
    return actionFail(E.UNKNOWN);
  }
  return actionOk({ favorite: true });
}
