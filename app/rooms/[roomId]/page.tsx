import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { leaveRoom } from "@/app/actions/rooms";
import { UserSettingsPanel } from "@/components/auth/user-settings-panel";
import {
  RoomSettingsPanel,
  type RoomSettingsPayload,
} from "@/components/rooms/room-settings-panel";
import { SoundboardApp } from "@/components/soundboard/soundboard-app";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Button } from "@/components/ui/button";
import { mapRoomPageError } from "@/lib/errors/messages";
import { getPermissionsForRole } from "@/lib/permissions/room-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoomActor } from "@/lib/supabase/auth-context";
import type { RoomRole } from "@/types/database";

type Props = {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ error?: string; settings?: string }>;
};

export default async function RoomPage({ params, searchParams }: Props) {
  const { roomId } = await params;
  const { error: errorCode, settings } = await searchParams;
  const pageError = mapRoomPageError(errorCode);

  const actor = await requireRoomActor(roomId);
  if (!actor.ok) {
    if (!actor.user) redirect(`/login?next=/rooms/${roomId}`);
    notFound();
  }

  const { supabase, user, membership } = actor;

  const { data: room } = await supabase
    .from("rooms")
    .select(
      "id, name, description, room_code, master_volume, guest_can_play, max_simultaneous_sounds, upload_enabled, guest_enabled, obs_volume, default_cooldown_ms, max_events_per_minute, max_members",
    )
    .eq("id", roomId)
    .maybeSingle();

  if (!room) notFound();

  const { data: members } = await supabase
    .from("room_members")
    .select(
      "user_id, display_name, role, can_play, can_upload, is_muted, joined_at",
    )
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });

  const { data: sounds } = await supabase
    .from("sounds")
    .select(
      "id, name, audio_path, button_color, text_color, image_path, volume, cooldown_ms, category_id, sort_order",
    )
    .eq("room_id", roomId)
    .eq("approval_status", "approved")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: categories } = await supabase
    .from("sound_categories")
    .select("id, name, sort_order")
    .eq("room_id", roomId)
    .order("sort_order", { ascending: true });

  const permissions = getPermissionsForRole(membership.role);

  let settingsPayload: RoomSettingsPayload | null = null;
  if (permissions.canEditRoom) {
    let hasPassword = false;
    let tokens: RoomSettingsPayload["tokens"] = [];

    if (membership.role === "owner") {
      try {
        const admin = createAdminClient();
        const { data } = await admin
          .from("rooms")
          .select("password_hash")
          .eq("id", roomId)
          .maybeSingle();
        hasPassword = Boolean(data?.password_hash);
      } catch {
        hasPassword = false;
      }

      const { data: tokenRows } = await supabase
        .from("obs_tokens")
        .select("id, token_hint, enabled, created_at, last_used_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false });
      tokens = tokenRows ?? [];
    }

    settingsPayload = {
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        guest_enabled: room.guest_enabled,
        guest_can_play: room.guest_can_play,
        upload_enabled: room.upload_enabled,
        master_volume: room.master_volume,
        obs_volume: room.obs_volume,
        default_cooldown_ms: room.default_cooldown_ms,
        max_events_per_minute: room.max_events_per_minute,
        max_simultaneous_sounds: room.max_simultaneous_sounds,
        max_members: room.max_members,
        has_password: hasPassword,
      },
      role: membership.role,
      tokens,
    };
  }

  return (
    <main className="relative flex min-h-full flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b bg-background/80 px-4 py-2">
        {settingsPayload && (
          <Suspense
            fallback={
              <Button type="button" variant="outline" size="sm" disabled>
                部屋設定
              </Button>
            }
          >
            <RoomSettingsPanel
              payload={settingsPayload}
              defaultOpen={settings === "1"}
            />
          </Suspense>
        )}
        <UserSettingsPanel displayName={membership.display_name} />
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">ルーム一覧</Link>
        </Button>
        {membership.role !== "owner" && (
          <form
            action={async () => {
              "use server";
              await leaveRoom(roomId);
            }}
          >
            <Button type="submit" variant="destructive" size="sm">
              退出
            </Button>
          </form>
        )}
      </div>

      {pageError && (
        <div className="px-4 pt-3">
          <ErrorAlert error={pageError} />
        </div>
      )}

      <SoundboardApp
        roomId={roomId}
        roomName={room.name}
        roomDescription={room.description}
        roomCode={room.room_code}
        masterVolume={Number(room.master_volume)}
        maxSimultaneous={room.max_simultaneous_sounds}
        guestCanPlay={room.guest_can_play}
        uploadEnabled={room.upload_enabled}
        role={membership.role}
        canPlayFlag={membership.can_play}
        canUploadFlag={membership.can_upload}
        isMuted={membership.is_muted}
        userId={user.id}
        displayName={membership.display_name}
        sounds={sounds ?? []}
        categories={categories ?? []}
        members={(members ?? []).map((m) => ({
          user_id: m.user_id,
          display_name: m.display_name,
          role: m.role as RoomRole,
          can_play: m.can_play,
          can_upload: m.can_upload,
          is_muted: m.is_muted,
          joined_at: m.joined_at,
        }))}
      />
    </main>
  );
}
