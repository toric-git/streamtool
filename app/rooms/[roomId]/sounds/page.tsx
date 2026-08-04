import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createCategory } from "@/app/actions/categories";
import { PendingSoundList } from "@/components/sounds/pending-sound-list";
import { SoundManageList } from "@/components/sounds/sound-manage-list";
import { SoundUploadForm } from "@/components/sounds/sound-upload-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canUserUpload, isOwnerOrAdmin } from "@/lib/permissions/room-permissions";
import { requireRoomActor } from "@/lib/supabase/auth-context";

type Props = { params: Promise<{ roomId: string }> };

export default async function SoundsPage({ params }: Props) {
  const { roomId } = await params;
  const actor = await requireRoomActor(roomId);
  if (!actor.ok) {
    if (!actor.user) redirect(`/login?next=/rooms/${roomId}/sounds`);
    notFound();
  }

  const { supabase, membership } = actor;
  const role = membership.role;
  const canManage = isOwnerOrAdmin(role);

  const { data: room } = await supabase
    .from("rooms")
    .select("upload_enabled, upload_requires_approval")
    .eq("id", roomId)
    .maybeSingle();

  if (!room) notFound();

  const canUpload = canUserUpload({
    role,
    canUploadFlag: membership.can_upload,
    uploadEnabled: room.upload_enabled,
  });

  const { data: categories } = await supabase
    .from("sound_categories")
    .select("id, name")
    .eq("room_id", roomId)
    .order("sort_order", { ascending: true });

  const { data: sounds } = await supabase
    .from("sounds")
    .select("*")
    .eq("room_id", roomId)
    .order("sort_order", { ascending: true });

  const pending = (sounds ?? []).filter((s) => s.approval_status === "pending");
  const managed = (sounds ?? []).filter((s) => s.approval_status !== "rejected");

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">サウンド管理</h1>
          <p className="text-sm text-muted-foreground">
            アップロード・承認・並び替え。承認前の音はボードと OBS に出ません。
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/rooms/${roomId}`}>ボードへ戻る</Link>
        </Button>
      </div>

      <SoundUploadForm
        roomId={roomId}
        categories={categories ?? []}
        canUpload={canUpload}
      />

      {canManage && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">カテゴリー追加</h2>
          <form
            className="flex flex-wrap gap-2"
            action={async (formData) => {
              "use server";
              await createCategory(roomId, String(formData.get("name") || ""));
            }}
          >
            <Input
              name="name"
              placeholder="カテゴリー名"
              maxLength={40}
              required
              className="max-w-xs"
            />
            <Button type="submit" variant="secondary">
              追加
            </Button>
          </form>
        </section>
      )}

      {canManage && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">承認待ち</h2>
          <PendingSoundList sounds={pending} canModerate={canManage} />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">登録済みサウンド</h2>
        {(managed.length === 0 && (
          <p className="text-sm text-muted-foreground">まだサウンドがありません。</p>
        )) || (
          <SoundManageList
            roomId={roomId}
            initialSounds={managed}
            canManage={canManage}
          />
        )}
      </section>
    </main>
  );
}
