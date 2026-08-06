"use server";

import { revalidatePath } from "next/cache";
import {
  actionFail,
  actionFailFrom,
  actionOk,
  type ActionResult,
} from "@/lib/actions/result";
import { E } from "@/lib/errors/catalog";
import { isOwnerOrAdmin } from "@/lib/permissions/room-permissions";
import { requireRoomActor } from "@/lib/supabase/auth-context";

export async function createCategory(
  roomId: string,
  name: string,
  color?: string | null,
): Promise<ActionResult> {
  const actor = await requireRoomActor(roomId);
  if (!actor.ok) return actionFailFrom(actor);
  if (!isOwnerOrAdmin(actor.membership.role)) {
    return actionFail(E.CATEGORY_FORBIDDEN);
  }

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 40) {
    return actionFail(E.CATEGORY_NAME_INVALID);
  }

  const { error } = await actor.supabase.from("sound_categories").insert({
    room_id: roomId,
    name: trimmed,
    color: color ?? null,
  });

  if (error) {
    console.error(
      "[categories]",
      E.CATEGORY_CREATE_FAILED.code,
      error.code,
      error.message,
    );
    return actionFail(E.CATEGORY_CREATE_FAILED);
  }

  revalidatePath(`/rooms/${roomId}/sounds`);
  return actionOk();
}
