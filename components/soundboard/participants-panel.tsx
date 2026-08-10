"use client";

import { useMemo } from "react";
import { InvitePanel } from "@/components/rooms/invite-panel";
import {
  MemberManageList,
  type ManageableMember,
} from "@/components/rooms/member-manage-list";
import { ConnectionStatusBadge } from "@/components/soundboard/connection-status";
import { useRoomMembersLive } from "@/hooks/use-room-members-live";
import { useRoomPresence } from "@/hooks/use-room-presence";
import { OBS_DISPLAY_NAME } from "@/lib/rooms/members";
import { isOwnerOrAdmin } from "@/lib/permissions/room-permissions";
import type { RoomRole } from "@/types/database";

export function ParticipantsPanel({
  roomId,
  roomCode,
  userId,
  displayName,
  role,
  members,
}: {
  roomId: string;
  roomCode: string;
  userId: string;
  displayName: string;
  role: RoomRole;
  members: ManageableMember[];
}) {
  const { participants, status } = useRoomPresence({
    roomId,
    userId,
    displayName,
    role,
  });
  const liveMembers = useRoomMembersLive(roomId, members);
  const canManage = isOwnerOrAdmin(role);

  const onlineIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of participants) {
      if (p.displayName === OBS_DISPLAY_NAME || p.isObs) continue;
      ids.add(p.userId);
    }
    return ids;
  }, [participants]);

  const manageableMembers = useMemo<ManageableMember[]>(() => {
    return liveMembers.map((m) => {
      const initial = members.find((x) => x.user_id === m.user_id);
      return {
        user_id: m.user_id,
        display_name: m.display_name,
        role: (m.role as RoomRole) ?? "member",
        can_play: m.can_play,
        can_upload: m.can_upload ?? initial?.can_upload ?? false,
        is_muted: m.is_muted,
        joined_at: m.joined_at ?? initial?.joined_at ?? new Date(0).toISOString(),
      };
    });
  }, [liveMembers, members]);

  return (
    <aside className="flex h-full max-h-[calc(100vh-8rem)] flex-col gap-3 overflow-y-auto rounded-2xl border bg-card/95 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-semibold tracking-tight">
          参加者・招待
        </h2>
        <ConnectionStatusBadge status={status} />
      </div>

      <InvitePanel roomCode={roomCode} />

      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground">
          オンライン状況
        </p>
        <ul className="space-y-1.5 text-sm">
          {manageableMembers.length === 0 ? (
            <li className="text-muted-foreground">まだ参加者がいません</li>
          ) : (
            manageableMembers.map((m) => {
              const online = onlineIds.has(m.user_id);
              return (
                <li
                  key={m.user_id}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/40"
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
      </div>

      {canManage && (
        <div className="space-y-2 border-t border-border/70 pt-3">
          <p className="text-xs font-bold text-muted-foreground">メンバー管理</p>
          <MemberManageList
            roomId={roomId}
            actorUserId={userId}
            actorRole={role}
            members={manageableMembers}
            compact
          />
        </div>
      )}
    </aside>
  );
}
