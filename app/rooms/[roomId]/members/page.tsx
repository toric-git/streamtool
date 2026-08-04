import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MemberManageList } from "@/components/rooms/member-manage-list";
import { Button } from "@/components/ui/button";
import { requireRoomActor } from "@/lib/supabase/auth-context";
import type { RoomRole } from "@/types/database";

type Props = { params: Promise<{ roomId: string }> };

export default async function MembersPage({ params }: Props) {
  const { roomId } = await params;
  const actor = await requireRoomActor(roomId);
  if (!actor.ok) {
    if (!actor.user) redirect(`/login?next=/rooms/${roomId}/members`);
    notFound();
  }

  const { supabase, membership, user } = actor;

  const { data: members } = await supabase
    .from("room_members")
    .select("user_id, display_name, role, can_play, can_upload, is_muted, joined_at")
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">参加者管理</h1>
          <p className="text-sm text-muted-foreground">
            オーナーはキックと管理者任命、管理者は再生禁止を操作できます。
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/rooms/${roomId}`}>ボードへ戻る</Link>
        </Button>
      </div>
      <MemberManageList
        roomId={roomId}
        actorUserId={user.id}
        actorRole={membership.role}
        members={(members ?? []).map((m) => ({
          ...m,
          role: m.role as RoomRole,
        }))}
      />
    </main>
  );
}
