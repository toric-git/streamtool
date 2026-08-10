"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { APP_URL } from "@/lib/app-config";
import {
  actionFail,
  actionFailFrom,
  actionOk,
  type ActionResult,
} from "@/lib/actions/result";
import { E, withMessage } from "@/lib/errors/catalog";
import { mapRoomJoinError } from "@/lib/errors/messages";
import { PLACEHOLDER_DISPLAY_NAME } from "@/lib/auth/display-name";
import { buildInviteUrl, generateRoomCode } from "@/lib/rooms/codes";
import { seedDefaultSounds } from "@/lib/sounds/seed-default-sounds";
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
  if (!user) return actionFail(E.AUTH_REQUIRED);

  const parsed = createRoomSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    password: formData.get("password") || "",
    guestEnabled: formData.get("guestEnabled") === "on",
    guestCanPlay: formData.get("guestCanPlay") === "on",
    uploadEnabled: formData.get("uploadEnabled") === "on",
  });

  if (!parsed.success) {
    return actionFail(
      withMessage(
        E.VALIDATION,
        parsed.error.issues[0]?.message ?? E.VALIDATION.message,
      ),
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  // Never fall back to Google full_name / email local-part.
  const metaName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name.trim()
      : "";
  const displayName =
    (metaName && metaName.length > 0 ? metaName : null) ??
    (profile?.display_name &&
    profile.display_name !== PLACEHOLDER_DISPLAY_NAME
      ? profile.display_name
      : null);

  if (!displayName) {
    return actionFail(E.AUTH_DISPLAY_NAME_REQUIRED);
  }

  // Ensure profile exists (FK on rooms.owner_id). Trigger may have missed OAuth users.
  if (!profile || profile.display_name !== displayName) {
    const admin = createAdminClient();
    const { error: profileError } = await admin.from("profiles").upsert({
      id: user.id,
      display_name: displayName,
    });
    if (profileError) {
      console.error(
        "[rooms]",
        E.ROOM_CREATE_PROFILE.code,
        profileError.code,
        profileError.message,
        { userId: user.id },
      );
      return actionFail(E.ROOM_CREATE_PROFILE);
    }
  }

  const password = parsed.data.password?.trim() || "";
  const passwordHash = password ? await hashRoomPassword(password) : null;

  // Bootstrap via service role: owner SELECT RLS may be missing on older DBs,
  // which breaks insert().select() and room_members EXISTS checks.
  const admin = createAdminClient();
  let roomId: string | null = null;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const roomCode = generateRoomCode();
    const { data, error } = await admin
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
        // Approval workflow removed from product UI; uploads go live immediately.
        upload_requires_approval: false,
      })
      .select("id")
      .single();

    if (!error && data) {
      roomId = data.id;
      break;
    }
    lastError = error?.message ?? "create failed";
    if (!error?.message.toLowerCase().includes("duplicate")) {
      console.error(
        "[rooms]",
        E.ROOM_CREATE_FAILED.code,
        error?.code,
        error?.message,
        { userId: user.id, attempt },
      );
      return actionFail(E.ROOM_CREATE_FAILED);
    }
  }

  if (!roomId) {
    console.error("[rooms]", E.ROOM_CREATE_CODE.code, lastError, {
      userId: user.id,
    });
    return actionFail(E.ROOM_CREATE_CODE);
  }

  const { error: memberError } = await admin.from("room_members").insert({
    room_id: roomId,
    user_id: user.id,
    display_name: displayName,
    role: "owner" satisfies RoomRole,
    can_play: true,
    can_upload: true,
  });

  if (memberError) {
    console.error(
      "[rooms]",
      E.ROOM_CREATE_MEMBER.code,
      memberError.code,
      memberError.message,
      { userId: user.id, roomId },
    );
    await admin.from("rooms").delete().eq("id", roomId);
    return actionFail(E.ROOM_CREATE_MEMBER);
  }

  try {
    const seeded = await seedDefaultSounds({
      admin,
      roomId,
      ownerId: user.id,
    });
    console.info("[rooms] default sounds", seeded);
    if (seeded.seeded < 4 && seeded.failed > 0) {
      console.error(
        "[rooms]",
        seeded.seeded === 0
          ? E.ROOM_CREATE_SEED_FAILED.code
          : E.SOUND_SEED_PARTIAL.code,
        seeded,
        { userId: user.id, roomId },
      );
    }
  } catch (err) {
    // Room remains usable; owner can upload sounds manually.
    console.error("[rooms]", E.ROOM_CREATE_SEED_FAILED.code, err);
  }

  revalidatePath("/dashboard");
  redirect(`/rooms/${roomId}`);
}

export async function updateRoom(
  roomId: string,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await requireRoomActor(roomId);
  if (!actor.ok) return actionFailFrom(actor);

  const role = actor.membership.role;
  if (role !== "owner" && role !== "admin") {
    return actionFail(E.ROOM_UPDATE_FORBIDDEN);
  }

  const parsed = updateRoomSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    password: formData.get("password") || "",
    clearPassword: formData.get("clearPassword") === "on",
    guestEnabled: formData.get("guestEnabled") === "on",
    guestCanPlay: formData.get("guestCanPlay") === "on",
    uploadEnabled: formData.get("uploadEnabled") === "on",
    masterVolume: Number(formData.get("masterVolume") ?? 1),
    obsVolume: Number(formData.get("obsVolume") ?? 1),
    defaultCooldownMs: Number(formData.get("defaultCooldownMs") ?? 1000),
    maxEventsPerMinute: Number(formData.get("maxEventsPerMinute") ?? 30),
    maxSimultaneousSounds: Number(formData.get("maxSimultaneousSounds") ?? 4),
    maxMembers: Number(formData.get("maxMembers") ?? 30),
  });

  if (!parsed.success) {
    return actionFail(
      withMessage(
        E.VALIDATION,
        parsed.error.issues[0]?.message ?? E.VALIDATION.message,
      ),
    );
  }

  const patch: TablesUpdate<"rooms"> = {
    name: parsed.data.name,
    description: parsed.data.description || null,
    guest_enabled: parsed.data.guestEnabled,
    guest_can_play: parsed.data.guestCanPlay,
    upload_enabled: parsed.data.uploadEnabled,
    upload_requires_approval: false,
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
    console.error(
      "[rooms]",
      E.ROOM_UPDATE_FAILED.code,
      error.code,
      error.message,
      { roomId },
    );
    return actionFail(E.ROOM_UPDATE_FAILED);
  }

  revalidatePath(`/rooms/${roomId}`);
  revalidatePath(`/rooms/${roomId}/settings`);
  revalidatePath("/dashboard");
  return actionOk();
}

export async function deleteRoom(roomId: string): Promise<ActionResult> {
  const actor = await requireRoomActor(roomId);
  if (!actor.ok) return actionFailFrom(actor);
  if (actor.membership.role !== "owner") {
    return actionFail(E.ROOM_DELETE_FORBIDDEN);
  }

  const { error } = await actor.supabase.from("rooms").delete().eq("id", roomId);
  if (error) {
    console.error(
      "[rooms]",
      E.ROOM_DELETE_FAILED.code,
      error.code,
      error.message,
      { roomId },
    );
    return actionFail(E.ROOM_DELETE_FAILED);
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
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return actionFail(
      withMessage(
        E.VALIDATION,
        parsed.error.issues[0]?.message ?? E.VALIDATION.message,
      ),
    );
  }

  const supabase = await createClient();
  let {
    data: { user },
  } = await supabase.auth.getUser();

  const asGuest = formData.get("asGuest") === "on";

  if (!parsed.data.displayName) {
    return actionFail(E.ROOM_JOIN_GUEST_NAME);
  }

  if (!user && asGuest) {
    const { data, error } = await supabase.auth.signInAnonymously({
      options: {
        data: { display_name: parsed.data.displayName },
      },
    });
    if (error || !data.user) {
      console.error(
        "[rooms]",
        E.AUTH_ANON_FAILED.code,
        error?.name,
        error?.message,
      );
      return actionFail(E.AUTH_ANON_FAILED);
    }
    user = data.user;
  }

  if (!user) {
    return actionFail(E.ROOM_JOIN_AUTH_REQUIRED);
  }

  // Persist chosen room display name on the account (never Google full_name).
  if (!user.is_anonymous) {
    const { error: metaError } = await supabase.auth.updateUser({
      data: { display_name: parsed.data.displayName },
    });
    if (metaError) {
      console.error(
        "[rooms]",
        E.PROFILE_NAME_UPDATE_FAILED.code,
        metaError.name,
        metaError.message,
      );
    }
  }

  const { data: info, error: infoError } = await supabase.rpc(
    "get_room_join_info",
    { p_room_code: parsed.data.roomCode },
  );

  if (infoError) {
    console.error(
      "[rooms]",
      E.ROOM_JOIN_INFO_FAILED.code,
      infoError.code,
      infoError.message,
    );
    return actionFail(E.ROOM_JOIN_INFO_FAILED);
  }

  const roomInfo = Array.isArray(info) ? info[0] : info;
  if (!roomInfo) {
    return actionFail(E.ROOM_JOIN_INVALID_CODE);
  }

  if (roomInfo.member_count >= roomInfo.max_members) {
    return actionFail(E.ROOM_JOIN_FULL);
  }

  if (roomInfo.has_password) {
    const password = parsed.data.password?.trim() || "";
    if (!password) {
      return actionFail(E.ROOM_JOIN_PASSWORD_REQUIRED);
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return actionFail(E.ROOM_SERVER_CONFIG);
    }

    const { data: roomRow, error: roomError } = await admin
      .from("rooms")
      .select("id, password_hash, guest_enabled")
      .eq("id", roomInfo.room_id)
      .maybeSingle();

    if (roomError || !roomRow?.password_hash) {
      return actionFail(E.ROOM_NOT_FOUND);
    }

    const isAnonymous = Boolean(user.is_anonymous);
    if (isAnonymous && !roomRow.guest_enabled) {
      return actionFail(E.ROOM_JOIN_GUEST_DISABLED);
    }

    const ok = await verifyRoomPassword(password, roomRow.password_hash);
    if (!ok) {
      return actionFail(E.ROOM_JOIN_PASSWORD_WRONG);
    }

    const { data: joined, error: joinError } = await admin.rpc(
      "server_join_room",
      {
        p_user_id: user.id,
        p_room_code: parsed.data.roomCode,
        p_display_name: parsed.data.displayName,
      },
    );

    if (joinError) {
      const mapped = mapRoomJoinError(joinError.message);
      console.error(
        "[rooms]",
        mapped.code,
        joinError.code,
        joinError.message,
      );
      return actionFail(mapped);
    }

    const row = Array.isArray(joined) ? joined[0] : joined;
    if (!row?.room_id) {
      return actionFail(E.ROOM_JOIN_FAILED);
    }

    revalidatePath("/dashboard");
    redirect(`/rooms/${row.room_id}`);
  }

  if (!roomInfo.guest_enabled && Boolean(user.is_anonymous)) {
    return actionFail(E.ROOM_JOIN_GUEST_DISABLED);
  }

  const { data: joined, error: joinError } = await supabase.rpc("join_room", {
    p_room_code: parsed.data.roomCode,
    p_password: null,
    p_display_name: parsed.data.displayName,
  });

  if (joinError) {
    const mapped = mapRoomJoinError(joinError.message);
    console.error("[rooms]", mapped.code, joinError.code, joinError.message);
    return actionFail(mapped);
  }

  const row = Array.isArray(joined) ? joined[0] : joined;
  if (!row?.room_id) {
    return actionFail(E.ROOM_JOIN_FAILED);
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
    console.error(
      "[rooms]",
      E.ROOM_LEAVE_FAILED.code,
      error.code,
      error.message,
      { roomId },
    );
    redirect(`/rooms/${roomId}?error=leave_failed`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function getInviteLink(roomCode: string): Promise<string> {
  return buildInviteUrl(APP_URL, roomCode);
}
