import { E, type ErrorCode } from "@/lib/errors/catalog";
import { createClient } from "@/lib/supabase/server";
import type { RoomRole } from "@/types/database";
import type { User } from "@supabase/supabase-js";

export type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type RoomMembership = {
  role: RoomRole;
  can_play: boolean;
  can_upload: boolean;
  is_muted: boolean;
  display_name: string;
};

export async function getSessionUser(): Promise<{
  supabase: AppSupabaseClient;
  user: User | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function requireRoomActor(roomId: string): Promise<
  | {
      ok: true;
      supabase: AppSupabaseClient;
      user: User;
      membership: RoomMembership;
    }
  | {
      ok: false;
      error: string;
      code: ErrorCode;
      supabase: AppSupabaseClient;
      user: User | null;
    }
> {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return {
      ok: false,
      error: E.AUTH_REQUIRED.message,
      code: E.AUTH_REQUIRED.code,
      supabase,
      user: null,
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("room_members")
    .select("role, can_play, can_upload, is_muted, display_name")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    console.error(
      "[auth] membership lookup failed",
      E.ROOM_NOT_MEMBER.code,
      membershipError.code,
      membershipError.message,
    );
  }

  if (!membership) {
    return {
      ok: false,
      error: E.ROOM_NOT_MEMBER.message,
      code: E.ROOM_NOT_MEMBER.code,
      supabase,
      user,
    };
  }

  return {
    ok: true,
    supabase,
    user,
    membership: {
      ...membership,
      role: membership.role as RoomRole,
    },
  };
}

export async function getRoomMembership(
  supabase: AppSupabaseClient,
  roomId: string,
  userId: string,
): Promise<RoomMembership | null> {
  const { data } = await supabase
    .from("room_members")
    .select("role, can_play, can_upload, is_muted, display_name")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  return { ...data, role: data.role as RoomRole };
}
