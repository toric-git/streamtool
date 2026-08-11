import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { AppLogo } from "@/components/brand/app-logo";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { UserSettingsPanel } from "@/components/auth/user-settings-panel";
import {
  RoomSettingsPanel,
  type RoomSettingsPayload,
} from "@/components/rooms/room-settings-panel";
import { SoundboardApp } from "@/components/soundboard/soundboard-app";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Button } from "@/components/ui/button";
import { mapRoomPageError } from "@/lib/errors/messages";
import { E } from "@/lib/errors/catalog";
import { hasPaidRoomCapacity } from "@/lib/billing/capacity";
import { seedDefaultSounds } from "@/lib/sounds/seed-default-sounds";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireRoomActor,
} from "@/lib/supabase/auth-context";
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
      "id, name, description, room_code, master_volume, guest_can_play, max_simultaneous_sounds, upload_enabled, upload_requires_approval, guest_enabled, default_cooldown_ms, max_events_per_minute, max_members",
    )
    .eq("id", roomId)
    .maybeSingle();

  if (!room) notFound();

  const [membersResult, soundsResult, categoriesResult, settingsExtras] =
    await Promise.all([
      supabase
        .from("room_members")
        .select(
          "user_id, display_name, role, can_play, can_upload, is_muted, joined_at",
        )
        .eq("room_id", roomId)
        .order("joined_at", { ascending: true }),
      supabase
        .from("sounds")
        .select(
          "id, name, audio_path, button_color, text_color, image_path, volume, cooldown_ms, category_id, sort_order, playback_mode",
        )
        .eq("room_id", roomId)
        .eq("approval_status", "approved")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("sound_categories")
        .select("id, name, sort_order")
        .eq("room_id", roomId)
        .order("sort_order", { ascending: true }),
      membership.role === "owner"
        ? loadRoomSettingsExtras({ roomId })
        : Promise.resolve({ hasPassword: false }),
    ]);

  const members = membersResult.data;
  let sounds = soundsResult.data ?? [];
  let categories = categoriesResult.data ?? [];

  // Recover rooms whose seed never finished (no approved sounds yet).
  if (membership.role === "owner" && sounds.length === 0) {
    try {
      const admin = createAdminClient();
      const seeded = await seedDefaultSounds({
        admin,
        roomId,
        ownerId: user.id,
      });
      console.info("[rooms] ensure default sounds", seeded);
      const [soundsRetry, categoriesRetry] = await Promise.all([
        supabase
          .from("sounds")
          .select(
            "id, name, audio_path, button_color, text_color, image_path, volume, cooldown_ms, category_id, sort_order, playback_mode",
          )
          .eq("room_id", roomId)
          .eq("approval_status", "approved")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("sound_categories")
          .select("id, name, sort_order")
          .eq("room_id", roomId)
          .order("sort_order", { ascending: true }),
      ]);
      sounds = soundsRetry.data ?? [];
      categories = categoriesRetry.data ?? [];
    } catch (err) {
      console.error("[rooms]", E.ROOM_CREATE_SEED_FAILED.code, err);
    }
  }

  const settingsPayload: RoomSettingsPayload | null =
    membership.role === "owner"
      ? {
          room: {
            id: room.id,
            name: room.name,
            description: room.description,
            guest_enabled: room.guest_enabled,
            guest_can_play: room.guest_can_play,
            upload_enabled: room.upload_enabled,
            upload_requires_approval: room.upload_requires_approval,
            master_volume: room.master_volume,
            default_cooldown_ms: room.default_cooldown_ms,
            max_events_per_minute: room.max_events_per_minute,
            max_simultaneous_sounds: room.max_simultaneous_sounds,
            max_members: room.max_members,
            has_password: settingsExtras.hasPassword,
          },
          role: membership.role,
          paidCapacity: hasPaidRoomCapacity(user.email),
        }
      : null;

  return (
    <main className="relative flex min-h-full flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b bg-background/80 px-4 py-2">
        <AppLogo size="sm" className="mr-1" />
        {settingsPayload && (
          <Suspense
            fallback={
              <Button type="button" variant="outline" size="sm" disabled>
                オーナー設定
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
        <FeedbackButton size="sm" />
        <Button asChild variant="outline" size="sm" className="font-bold">
          <Link href="/dashboard">ルーム一覧</Link>
        </Button>
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
        sounds={sounds}
        categories={categories}
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

async function loadRoomSettingsExtras({
  roomId,
}: {
  roomId: string;
}): Promise<{
  hasPassword: boolean;
}> {
  let hasPassword = false;
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

  return { hasPassword };
}
