"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteRoom, leaveRoom } from "@/app/actions/rooms";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import type { AppError } from "@/lib/errors/catalog";
import type { RoomRole } from "@/types/database";

const ROLE_LABEL: Record<string, string> = {
  owner: "オーナー",
  admin: "管理者",
  member: "メンバー",
  guest: "ゲスト",
};

export type DashboardRoomItem = {
  id: string;
  name: string;
  room_code: string;
  description: string | null;
  role: RoomRole;
};

export function DashboardRoomList({ rooms }: { rooms: DashboardRoomItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [pending, startTransition] = useTransition();

  function onDelete(room: DashboardRoomItem) {
    if (
      !window.confirm(
        `「${room.name}」を削除しますか？\nパッドや招待コードも含めて完全に消え、元に戻せません。`,
      )
    ) {
      return;
    }
    setError(null);
    setPendingId(room.id);
    startTransition(async () => {
      const result = await deleteRoom(room.id);
      setPendingId(null);
      // Successful delete redirects to /dashboard; failures return here.
      if (result && "ok" in result && !result.ok) {
        setError({ code: result.code, message: result.error });
        return;
      }
      router.refresh();
    });
  }

  function onLeave(room: DashboardRoomItem) {
    if (!window.confirm(`「${room.name}」から退出しますか？`)) return;
    setError(null);
    setPendingId(room.id);
    startTransition(async () => {
      await leaveRoom(room.id);
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-3">
      {error && <ErrorAlert error={error} />}
      <ul className="divide-y rounded-xl border">
        {rooms.map((room) => {
          const busy = pending && pendingId === room.id;
          const isOwner = room.role === "owner";
          return (
            <li
              key={room.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{room.name}</p>
                <p className="text-xs text-muted-foreground">
                  {ROLE_LABEL[room.role] ?? room.role} · コード{" "}
                  {room.room_code}
                  {room.description?.trim()
                    ? ` · ${room.description.trim()}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="font-bold">
                  <Link href={`/rooms/${room.id}`}>開く</Link>
                </Button>
                {isOwner ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="font-bold"
                    disabled={busy}
                    onClick={() => onDelete(room)}
                  >
                    {busy ? "削除中…" : "削除"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="font-bold"
                    disabled={busy}
                    onClick={() => onLeave(room)}
                  >
                    {busy ? "退出中…" : "退出"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
