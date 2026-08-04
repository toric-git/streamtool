"use server";

import { revalidatePath } from "next/cache";
import { actionFail, actionOk, type ActionResult } from "@/lib/actions/result";
import { isOwnerOrAdmin } from "@/lib/permissions/room-permissions";
import { requireRoomActor } from "@/lib/supabase/auth-context";

export async function createCategory(
  roomId: string,
  name: string,
  color?: string | null,
): Promise<ActionResult> {
  const actor = await requireRoomActor(roomId);
  if (!actor.ok) return actionFail(actor.error);
  if (!isOwnerOrAdmin(actor.membership.role)) {
    return actionFail("カテゴリー作成権限がありません。");
  }

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 40) {
    return actionFail("カテゴリー名が不正です。");
  }

  const { error } = await actor.supabase.from("sound_categories").insert({
    room_id: roomId,
    name: trimmed,
    color: color ?? null,
  });

  if (error) {
    console.error("[categories] create failed", error.code);
    return actionFail("カテゴリーの作成に失敗しました。");
  }

  revalidatePath(`/rooms/${roomId}/sounds`);
  return actionOk();
}
