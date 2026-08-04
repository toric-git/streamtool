"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { APP_URL } from "@/lib/app-config";
import { actionFail, actionOk, type ActionResult } from "@/lib/actions/result";
import { mapRoomJoinError } from "@/lib/errors/messages";
import { buildInviteUrl, generateRoomCode } from "@/lib/rooms/codes";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSessionUser,
  requireRoomActor,
} from "@/lib/supabase/auth-context";
import { createClient } from "@/lib/supabase/server";
import { hashRoomPassword, verifyRoomPassword } from "@/lib/security/password";
import {
  createRoomSchema,
  joinRoomSchema,
  updateRoomSchema,
} from "@/lib/validation/schemas";
import type { RoomRole, TablesUpdate } from "@/types/database";

export async function createRoom(
  formData: FormData,
): Promise<ActionResult<{ roomId: string }>> {
  const { supabase, user } = await getSessionUser();
  if (!user) return actionFail("ログインが必要です。");

  const parsed = createRoomSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    password: formData.get("password") || "",
    guestEnabled: formData.get("guestEnabled") === "on",
    guestCanPlay: formData.get("guestCanPlay") === "on",
    uploadEnabled: formData.get("uploadEnabled") === "on",
    uploadRequiresApproval: formData.get("uploadRequiresApproval") !== "off",
  });

  if (!parsed.success) {
    return actionFail(
      parsed.error.issues[0]?.message ?? "入力内容が正しくありません",
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name ?? "Owner";
  const password = parsed.data.password?.trim() || "";
  const passwordHash = password ? await hashRoomPassword(password) : null;

  let roomId: string | null = null;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const roomCode = generateRoomCode();
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        owner_id: user.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        room_code: roomCode,
        password_hash: passwordHash,
        guest_enabled: parsed.data.guestEnabled,
        guest_can_play: parsed.data.guestCanPlay,
        upload_enabled: parsed.data.uploadEnabled,
        upload_requires_approval: parsed.data.uploadRequiresApproval,
      })
      .select("id")
      .single();

    if (!error && data) {
      roomId = data.id;
      break;
    }
    lastError = error?.message ?? "create failed";
    if (!error?.message.toLowerCase().includes("duplicate")) {
      console.error("[rooms] create failed", error?.code);
      return actionFail(
        "部屋の作成に失敗しました。しばらくしてから再度お試しください。",
      );
    }
  }

  if (!roomId) {
    console.error("[rooms] create exhausted retries", lastError);
    return actionFail("部屋コードの発行に失敗しました。再試行してください。");
  }

  const { error: memberError } = await supabase.from("room_members").insert({
    room_id: roomId,
    user_id: user.id,
    display_name: displayName,
    role: "owner" satisfies RoomRole,
    can_play: true,
    can_upload: true,
  });

  if (memberError) {
    console.error("[rooms] owner member insert failed", memberError.code);
    await supabase.from("rooms").delete().eq("id", roomId);
    return actionFail(
      "部屋メンバーの登録に失敗しました。もう一度作成してください。",
    );
  }

  revalidatePath("/dashboard");
  redirect(`/rooms/${roomId}`);
}

export async function updateRoom(
  roomId: string,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await requireRoomActor(roomId);
  if (!actor.ok) return actionFail(actor.error);

  const role = actor.membership.role;
  if (role !== "owner" && role !== "admin") {
    return actionFail("部屋設定を変更する権限がありません。");
  }

  const parsed = updateRoomSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    password: formData.get("password") || "",
    clearPassword: formData.get("clearPassword") === "on",
    guestEnabled: formData.get("guestEnabled") === "on",
    guestCanPlay: formData.get("guestCanPlay") === "on",
    uploadEnabled: formData.get("uploadEnabled") === "on",
    uploadRequiresApproval: formData.get("uploadRequiresApproval") === "on",
    masterVolume: Number(formData.get("masterVolume") ?? 1),
    obsVolume: Number(formData.get("obsVolume") ?? 1),
    defaultCooldownMs: Number(formData.get("defaultCooldownMs") ?? 1000),
    maxEventsPerMinute: Number(formData.get("maxEventsPerMinute") ?? 30),
    maxSimultaneousSounds: Number(formData.get("maxSimultaneousSounds") ?? 4),
    maxMembers: Number(formData.get("maxMembers") ?? 30),
  });

  if (!parsed.success) {
    return actionFail(
      parsed.error.issues[0]?.message ?? "入力内容が正しくありません",
    );
  }

  const patch: TablesUpdate<"rooms"> = {
    name: parsed.data.name,
    description: parsed.data.description || null,
    guest_enabled: parsed.data.guestEnabled,
    guest_can_play: parsed.data.guestCanPlay,
    upload_enabled: parsed.data.uploadEnabled,
    upload_requires_approval: parsed.data.uploadRequiresApproval,
    master_volume: parsed.data.masterVolume,
    obs_volume: parsed.data.obsVolume,
    default_cooldown_ms: parsed.data.defaultCooldownMs,
    max_events_per_minute: parsed.data.maxEventsPerMinute,
    max_simultaneous_sounds: parsed.data.maxSimultaneousSounds,
    max_members: parsed.data.maxMembers,
  };

  if (role === "owner") {
    if (parsed.data.clearPassword) {
      patch.password_hash = null;
    } else if (parsed.data.password?.trim()) {
      patch.password_hash = await hashRoomPassword(parsed.data.password.trim());
    }
  }

  const { error } = await actor.supabase
    .from("rooms")
    .update(patch)
    .eq("id", roomId);
  if (error) {
    console.error("[rooms] update failed", error.code);
    return actionFail("部屋設定の更新に失敗しました。");
  }

  revalidatePath(`/rooms/${roomId}`);
  revalidatePath(`/rooms/${roomId}/settings`);
  revalidatePath("/dashboard");
  return actionOk();
}

export async function deleteRoom(roomId: string): Promise<ActionResult> {
  const actor = await requireRoomActor(roomId);
  if (!actor.ok) return actionFail(actor.error);
  if (actor.membership.role !== "owner") {
    return actionFail("部屋を削除できるのはオーナーのみです。");
  }

  const { error } = await actor.supabase.from("rooms").delete().eq("id", roomId);
  if (error) {
    console.error("[rooms] delete failed", error.code);
    return actionFail("部屋の削除に失敗しました。");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function joinRoomAction(
  formData: FormData,
): Promise<ActionResult<{ roomId: string }>> {
  const parsed = joinRoomSchema.safeParse({
    roomCode: formData.get("roomCode"),
    password: formData.get("password") || "",
    displayName: formData.get("displayName") || undefined,
  });

  if (!parsed.success) {
    return actionFail(
      parsed.error.issues[0]?.message ?? "入力内容が正しくありません",
    );
  }

  const supabase = await createClient();
  let {
    data: { user },
  } = await supabase.auth.getUser();

  const asGuest = formData.get("asGuest") === "on";

  if (!user && asGuest) {
    if (!parsed.data.displayName) {
      return actionFail("ゲスト参加には表示名が必要です。");
    }
    const { data, error } = await supabase.auth.signInAnonymously({
      options: {
        data: { display_name: parsed.data.displayName },
      },
    });
    if (error || !data.user) {
      console.error("[rooms] anonymous sign-in failed", error?.name);
      return actionFail(
        "ゲスト認証に失敗しました。Supabase で Anonymous Sign-Ins が有効か確認してください。",
      );
    }
    user = data.user;
  }

  if (!user) {
    return actionFail("参加するにはログインまたはゲスト参加が必要です。");
  }

  const { data: info, error: infoError } = await supabase.rpc(
    "get_room_join_info",
    { p_room_code: parsed.data.roomCode },
  );

  if (infoError) {
    console.error("[rooms] join info failed", infoError.code);
    return actionFail("部屋情報の取得に失敗しました。");
  }

  const roomInfo = Array.isArray(info) ? info[0] : info;
  if (!roomInfo) {
    return actionFail("招待コードが無効です。コードを確認してください。");
  }

  if (roomInfo.member_count >= roomInfo.max_members) {
    return actionFail("部屋が満員です。空きが出てから再度お試しください。");
  }

  if (roomInfo.has_password) {
    const password = parsed.data.password?.trim() || "";
    if (!password) {
      return actionFail("この部屋には参加パスワードが必要です。");
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return actionFail(
        "サーバー設定が不足しています。SUPABASE_SERVICE_ROLE_KEY を設定してください。",
      );
    }

    const { data: roomRow, error: roomError } = await admin
      .from("rooms")
      .select("id, password_hash, guest_enabled")
      .eq("id", roomInfo.room_id)
      .maybeSingle();

    if (roomError || !roomRow?.password_hash) {
      return actionFail("部屋が見つかりません。");
    }

    const isAnonymous = Boolean(user.is_anonymous);
    if (isAnonymous && !roomRow.guest_enabled) {
      return actionFail(
        "この部屋はゲスト参加が許可されていません。ログインして参加してください。",
      );
    }

    const ok = await verifyRoomPassword(password, roomRow.password_hash);
    if (!ok) {
      return actionFail("参加パスワードが違います。");
    }

    const { data: joined, error: joinError } = await admin.rpc(
      "server_join_room",
      {
        p_user_id: user.id,
        p_room_code: parsed.data.roomCode,
        p_display_name: parsed.data.displayName ?? null,
      },
    );

    if (joinError) {
      console.error("[rooms] server_join_room failed", joinError.code);
      return actionFail(mapRoomJoinError(joinError.message));
    }

    const row = Array.isArray(joined) ? joined[0] : joined;
    if (!row?.room_id) {
      return actionFail("部屋への参加に失敗しました。");
    }

    revalidatePath("/dashboard");
    redirect(`/rooms/${row.room_id}`);
  }

  if (!roomInfo.guest_enabled && Boolean(user.is_anonymous)) {
    return actionFail(
      "この部屋はゲスト参加が許可されていません。ログインして参加してください。",
    );
  }

  const { data: joined, error: joinError } = await supabase.rpc("join_room", {
    p_room_code: parsed.data.roomCode,
    p_password: null,
    p_display_name: parsed.data.displayName ?? null,
  });

  if (joinError) {
    console.error("[rooms] join_room failed", joinError.code);
    return actionFail(mapRoomJoinError(joinError.message));
  }

  const row = Array.isArray(joined) ? joined[0] : joined;
  if (!row?.room_id) {
    return actionFail("部屋への参加に失敗しました。");
  }

  revalidatePath("/dashboard");
  redirect(`/rooms/${row.room_id}`);
}

export async function leaveRoom(roomId: string): Promise<void> {
  const actor = await requireRoomActor(roomId);
  if (!actor.ok) {
    redirect("/login");
  }

  if (actor.membership.role === "owner") {
    redirect(`/rooms/${roomId}?error=owner_leave`);
  }

  const { error } = await actor.supabase
    .from("room_members")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", actor.user.id);

  if (error) {
    console.error("[rooms] leave failed", error.code);
    redirect(`/rooms/${roomId}?error=leave_failed`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function getInviteLink(roomCode: string): Promise<string> {
  return buildInviteUrl(APP_URL, roomCode);
}
