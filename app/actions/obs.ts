"use server";

import { revalidatePath } from "next/cache";
import { actionFail, actionOk, type ActionResult } from "@/lib/actions/result";
import { APP_URL } from "@/lib/app-config";
import {
  generateObsTokenPlain,
  hashObsToken,
  obsTokenHint,
} from "@/lib/obs/token";
import { buildObsUrl } from "@/lib/rooms/codes";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoomActor } from "@/lib/supabase/auth-context";

export type ObsTokenResult = ActionResult<{
  plainToken: string;
  url: string;
  hint: string;
}>;

export async function issueObsToken(roomId: string): Promise<ObsTokenResult> {
  const actor = await requireRoomActor(roomId);
  if (!actor.ok) return actionFail(actor.error);
  if (actor.membership.role !== "owner") {
    return actionFail("OBSトークンを発行できるのはオーナーのみです。");
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return actionFail(
      "SUPABASE_SERVICE_ROLE_KEY または OBS_TOKEN_PEPPER が未設定です。",
    );
  }

  await admin
    .from("obs_tokens")
    .update({ enabled: false })
    .eq("room_id", roomId)
    .eq("enabled", true);

  const plainToken = generateObsTokenPlain();
  const tokenHash = hashObsToken(plainToken);
  const hint = obsTokenHint(plainToken);

  const { error } = await admin.from("obs_tokens").insert({
    room_id: roomId,
    token_hash: tokenHash,
    token_hint: hint,
    enabled: true,
  });

  if (error) {
    console.error("[obs] issue token failed", error.code);
    return actionFail("OBSトークンの発行に失敗しました。");
  }

  revalidatePath(`/rooms/${roomId}/settings`);
  return actionOk({
    plainToken,
    hint,
    url: buildObsUrl(APP_URL, roomId, plainToken),
  });
}

export async function listObsTokenMeta(roomId: string) {
  const actor = await requireRoomActor(roomId);
  if (!actor.ok || actor.membership.role !== "owner") return [];

  const { data } = await actor.supabase
    .from("obs_tokens")
    .select("id, token_hint, enabled, created_at, last_used_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false });

  return data ?? [];
}
