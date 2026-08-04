"use client";

import { useMemo } from "react";
import { useRoomPresence } from "@/hooks/use-room-presence";
import { useRoomMembersLive } from "@/hooks/use-room-members-live";
import { ConnectionStatusBadge } from "@/components/soundboard/connection-status";
import { OBS_DISPLAY_NAME } from "@/lib/rooms/members";

type Member = {
  user_id: string;
  display_name: string;
  role: string;
  can_play: boolean;
  is_muted: boolean;
};

export function ParticipantsPanel({
  roomId,
  userId,
  displayName,
  role,
  members,
}: {
  roomId: string;
  userId: string;
  displayName: string;
  role: string;
  members: Member[];
}) {
  const { participants, status } = useRoomPresence({
    roomId,
    userId,
    displayName,
    role,
  });
  const liveMembers = useRoomMembersLive(roomId, members);

  const onlineIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of participants) {
      if (p.displayName === OBS_DISPLAY_NAME || p.isObs) continue;
      ids.add(p.userId);
    }
    return ids;
  }, [participants]);

  return (
    <aside className="flex h-full flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">参加者</h2>
        <ConnectionStatusBadge status={status} />
      </div>
      <ul className="space-y-2 overflow-y-auto text-sm">
        {liveMembers.length === 0 ? (
          <li className="text-muted-foreground">まだ参加者がいません</li>
        ) : (
          liveMembers.map((m) => {
            const online = onlineIds.has(m.user_id);
            return (
              <li
                key={m.user_id}
                className="flex items-center justify-between gap-2 rounded-lg border border-transparent px-2 py-1.5 hover:border-border"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {m.display_name}
                    {m.user_id === userId ? "（あなた）" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.role}
                    {m.is_muted ? " · ミュート" : ""}
                    {!m.can_play ? " · 再生禁止" : ""}
                  </p>
                </div>
                <span
                  className={
                    online
                      ? "text-xs font-medium text-teal-700"
                      : "text-xs text-muted-foreground"
                  }
                >
                  {online ? "オンライン" : "オフライン"}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}
