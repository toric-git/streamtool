"use server";

import { revalidatePath } from "next/cache";
import {
  actionFail,
  actionFailFrom,
  actionOk,
  type ActionResult,
} from "@/lib/actions/result";
import { E } from "@/lib/errors/catalog";
import { mapMemberError } from "@/lib/errors/messages";
import { requireRoomActor } from "@/lib/supabase/auth-context";
import { z } from "zod";

function revalidateMembers(roomId: string) {
  revalidatePath(`/rooms/${roomId}`);
  revalidatePath(`/rooms/${roomId}/members`);
}

export async function kickMember(
  roomId: string,
  userId: string,
): Promise<ActionResult> {
  const parsed = z
    .object({ roomId: z.string().uuid(), userId: z.string().uuid() })
    .safeParse({ roomId, userId });
  if (!parsed.success) return actionFail(E.VALIDATION);

  const actor = await requireRoomActor(roomId);
  if (!actor.ok) return actionFailFrom(actor);

  const { error } = await actor.supabase.rpc("kick_room_member", {
    p_room_id: roomId,
    p_user_id: userId,
  });
  if (error) {
    const mapped = mapMemberError(error.message);
    console.error("[members]", mapped.code, error.code, error.message);
    return actionFail(mapped);
  }

  revalidateMembers(roomId);
  return actionOk();
}

export async function setMemberPlayPermission(
  roomId: string,
  userId: string,
  canPlay: boolean,
  isMuted: boolean,
): Promise<ActionResult> {
  const parsed = z
    .object({
      roomId: z.string().uuid(),
      userId: z.string().uuid(),
      canPlay: z.boolean(),
      isMuted: z.boolean(),
    })
    .safeParse({ roomId, userId, canPlay, isMuted });
  if (!parsed.success) return actionFail(E.VALIDATION);

  const actor = await requireRoomActor(roomId);
  if (!actor.ok) return actionFailFrom(actor);

  const { error } = await actor.supabase.rpc("set_member_play_permission", {
    p_room_id: roomId,
    p_user_id: userId,
    p_can_play: canPlay,
    p_is_muted: isMuted,
  });
  if (error) {
    const mapped = mapMemberError(error.message);
    console.error("[members]", mapped.code, error.code, error.message);
    return actionFail(mapped);
  }

  revalidateMembers(roomId);
  return actionOk();
}

export async function setMemberUploadPermission(
  roomId: string,
  userId: string,
  canUpload: boolean,
): Promise<ActionResult> {
  const parsed = z
    .object({
      roomId: z.string().uuid(),
      userId: z.string().uuid(),
      canUpload: z.boolean(),
    })
    .safeParse({ roomId, userId, canUpload });
  if (!parsed.success) return actionFail(E.VALIDATION);

  const actor = await requireRoomActor(roomId);
  if (!actor.ok) return actionFailFrom(actor);

  const { error } = await actor.supabase.rpc("set_member_upload_permission", {
    p_room_id: roomId,
    p_user_id: userId,
    p_can_upload: canUpload,
  });
  if (error) {
    const mapped = mapMemberError(error.message);
    console.error("[members]", mapped.code, error.code, error.message);
    return actionFail(mapped);
  }

  revalidatePath(`/rooms/${roomId}/members`);
  return actionOk();
}

export async function setMemberRole(
  roomId: string,
  userId: string,
  role: "admin" | "member" | "guest",
): Promise<ActionResult> {
  const parsed = z
    .object({
      roomId: z.string().uuid(),
      userId: z.string().uuid(),
      role: z.enum(["admin", "member", "guest"]),
    })
    .safeParse({ roomId, userId, role });
  if (!parsed.success) return actionFail(E.VALIDATION);

  const actor = await requireRoomActor(roomId);
  if (!actor.ok) return actionFailFrom(actor);

  const { error } = await actor.supabase.rpc("set_member_role", {
    p_room_id: roomId,
    p_user_id: userId,
    p_role: role,
  });
  if (error) {
    const mapped = mapMemberError(error.message);
    console.error("[members]", mapped.code, error.code, error.message);
    return actionFail(mapped);
  }

  revalidateMembers(roomId);
  return actionOk();
}

export async function transferOwnership(
  roomId: string,
  newOwnerId: string,
): Promise<ActionResult> {
  const parsed = z
    .object({
      roomId: z.string().uuid(),
      newOwnerId: z.string().uuid(),
    })
    .safeParse({ roomId, newOwnerId });
  if (!parsed.success) return actionFail(E.VALIDATION);

  const actor = await requireRoomActor(roomId);
  if (!actor.ok) return actionFailFrom(actor);
  if (actor.membership.role !== "owner") {
    return actionFail(E.MEMBER_TRANSFER_FORBIDDEN);
  }

  const { error } = await actor.supabase.rpc("transfer_room_ownership", {
    p_room_id: roomId,
    p_new_owner_id: newOwnerId,
  });
  if (error) {
    const mapped = mapMemberError(error.message);
    console.error("[members]", mapped.code, error.code, error.message);
    return actionFail(mapped);
  }

  revalidateMembers(roomId);
  revalidatePath(`/rooms/${roomId}/settings`);
  revalidatePath("/dashboard");
  return actionOk();
}
