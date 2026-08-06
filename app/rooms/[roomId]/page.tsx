import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { leaveRoom } from "@/app/actions/rooms";
import { InviteDialog } from "@/components/rooms/invite-dialog";
import { SoundboardApp } from "@/components/soundboard/soundboard-app";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Button } from "@/components/ui/button";
import { mapRoomPageError } from "@/lib/errors/messages";
import { getPermissionsForRole } from "@/lib/permissions/room-permissions";
import { requireRoomActor } from "@/lib/supabase/auth-context";

type Props = {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function RoomPage({ params, searchParams }: Props) {
  const { roomId } = await params;
  const { error: errorCode } = await searchParams;
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
      "id, name, description, room_code, master_volume, guest_can_play, max_simultaneous_sounds",
    )
    .eq("id", roomId)
    .maybeSingle();

  if (!room) notFound();

  const { data: members } = await supabase
    .from("room_members")
    .select("user_id, display_name, role, can_play, is_muted")
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
    .select("id, name")
    .eq("room_id", roomId)
    .order("sort_order", { ascending: true });

  const permissions = getPermissionsForRole(membership.role);

  return (
    <main className="relative flex min-h-full flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b bg-background/80 px-4 py-2">
        <InviteDialog roomCode={room.room_code} />
        {permissions.canEditRoom && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/rooms/${roomId}/settings`}>設定</Link>
          </Button>
        )}
        <Button asChild variant="outline" size="sm">
          <Link href={`/rooms/${roomId}/members`}>メンバー</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/rooms/${roomId}/sounds`}>サウンド</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">ダッシュボード</Link>
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
        roomCode={room.room_code}
        masterVolume={Number(room.master_volume)}
        maxSimultaneous={room.max_simultaneous_sounds}
        guestCanPlay={room.guest_can_play}
        role={membership.role}
        canPlayFlag={membership.can_play}
        isMuted={membership.is_muted}
        userId={user.id}
        displayName={membership.display_name}
        sounds={sounds ?? []}
        categories={categories ?? []}
        members={members ?? []}
      />
    </main>
  );
}
