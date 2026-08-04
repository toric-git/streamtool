"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { filterHumanMembers } from "@/lib/rooms/members";

export type LiveMember = {
  user_id: string;
  display_name: string;
  role: string;
  can_play: boolean;
  is_muted: boolean;
};

export function useRoomMembersLive(
  roomId: string,
  initialMembers: LiveMember[],
) {
  const [members, setMembers] = useState(initialMembers);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-members:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { user_id?: string };
            if (!oldRow.user_id) return;
            setMembers((prev) => prev.filter((m) => m.user_id !== oldRow.user_id));
            return;
          }

          const row = payload.new as LiveMember;
          if (!row?.user_id) return;
          setMembers((prev) => {
            const idx = prev.findIndex((m) => m.user_id === row.user_id);
            if (idx === -1) return [...prev, row];
            const next = [...prev];
            next[idx] = {
              user_id: row.user_id,
              display_name: row.display_name,
              role: row.role,
              can_play: row.can_play,
              is_muted: row.is_muted,
            };
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, roomId]);

  return useMemo(() => filterHumanMembers(members), [members]);
}
