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
import {
  getSessionUser,
  requireRoomActor,
} from "@/lib/supabase/auth-context";

function revalidateBoard(roomId: string) {
  revalidatePath(`/rooms/${roomId}`);
  revalidatePath(`/rooms/${roomId}/sounds`);
}

export async function createCategory(
  roomId: string,
  name: string,
  color?: string | null,
): Promise<ActionResult<{ id: string }>> {
  const actor = await requireRoomActor(roomId);
  if (!actor.ok) return actionFailFrom(actor);
  if (!isOwnerOrAdmin(actor.membership.role)) {
    return actionFail(E.CATEGORY_FORBIDDEN);
  }

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 40) {
    return actionFail(E.CATEGORY_NAME_INVALID);
  }

  const { data: maxSort } = await actor.supabase
    .from("sound_categories")
    .select("sort_order")
    .eq("room_id", roomId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await actor.supabase
    .from("sound_categories")
    .insert({
      room_id: roomId,
      name: trimmed,
      color: color ?? null,
      sort_order: (maxSort?.sort_order ?? -1) + 1,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error(
      "[categories]",
      E.CATEGORY_CREATE_FAILED.code,
      error?.code,
      error?.message,
    );
    return actionFail(E.CATEGORY_CREATE_FAILED);
  }

  revalidateBoard(roomId);
  return actionOk({ id: data.id });
}

export async function renameCategory(
  categoryId: string,
  name: string,
): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 40) {
    return actionFail(E.CATEGORY_NAME_INVALID);
  }

  const { supabase, user } = await getSessionUser();
  if (!user) return actionFail(E.AUTH_REQUIRED);

  const { data: category } = await supabase
    .from("sound_categories")
    .select("id, room_id")
    .eq("id", categoryId)
    .maybeSingle();

  if (!category) return actionFail(E.CATEGORY_NOT_FOUND);

  const actor = await requireRoomActor(category.room_id);
  if (!actor.ok) return actionFailFrom(actor);
  if (!isOwnerOrAdmin(actor.membership.role)) {
    return actionFail(E.CATEGORY_FORBIDDEN);
  }

  const { error } = await actor.supabase
    .from("sound_categories")
    .update({ name: trimmed })
    .eq("id", categoryId)
    .eq("room_id", category.room_id);

  if (error) {
    console.error(
      "[categories]",
      E.CATEGORY_RENAME_FAILED.code,
      error.code,
      error.message,
    );
    return actionFail(E.CATEGORY_RENAME_FAILED);
  }

  revalidateBoard(category.room_id);
  return actionOk();
}
