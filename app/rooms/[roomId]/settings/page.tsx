import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RoomSettingsForm } from "@/components/rooms/room-settings-form";
import { ObsSetupDialog } from "@/components/rooms/obs-setup-dialog";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoomActor } from "@/lib/supabase/auth-context";

type Props = { params: Promise<{ roomId: string }> };

export default async function RoomSettingsPage({ params }: Props) {
  const { roomId } = await params;
  const actor = await requireRoomActor(roomId);
  if (!actor.ok) {
    if (!actor.user) redirect(`/login?next=/rooms/${roomId}/settings`);
    notFound();
  }

  const { supabase, membership } = actor;
  if (membership.role !== "owner" && membership.role !== "admin") {
    notFound();
  }

  const { data: room } = await supabase
    .from("rooms")
    .select(
      "id, name, description, guest_enabled, guest_can_play, upload_enabled, upload_requires_approval, master_volume, obs_volume, default_cooldown_ms, max_events_per_minute, max_simultaneous_sounds, max_members, room_code",
    )
    .eq("id", roomId)
    .maybeSingle();

  if (!room) notFound();

  let hasPassword = false;
  let tokens: {
    id: string;
    token_hint: string | null;
    enabled: boolean;
    created_at: string;
    last_used_at: string | null;
  }[] = [];

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

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">部屋設定</h1>
          <p className="text-sm text-muted-foreground">コード {room.room_code}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/rooms/${roomId}`}>ボードへ戻る</Link>
        </Button>
      </div>
      <RoomSettingsForm
        room={{ ...room, has_password: hasPassword }}
        role={membership.role}
      />
      {membership.role === "owner" && (
        <ObsSetupDialog roomId={roomId} tokens={tokens} />
      )}
    </main>
  );
}
