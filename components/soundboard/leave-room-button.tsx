"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { leaveRoom } from "@/app/actions/rooms";
import { Button } from "@/components/ui/button";
import type { RoomRole } from "@/types/database";

export function LeaveRoomButton({
  roomId,
  role,
}: {
  roomId: string;
  role: RoomRole;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isOwner = role === "owner";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      className="font-bold"
      onClick={() => {
        if (isOwner) {
          if (
            !window.confirm(
              "部屋の内容は保存されたまま、ルーム一覧に戻りますか？",
            )
          ) {
            return;
          }
          startTransition(() => {
            router.push("/dashboard");
          });
          return;
        }

        if (!window.confirm("この部屋から退出しますか？")) return;
        startTransition(async () => {
          await leaveRoom(roomId);
        });
      }}
    >
      {pending ? "移動中…" : isOwner ? "保存して退出" : "部屋を退出"}
    </Button>
  );
}
