"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { filterHumanMembers } from "@/lib/rooms/members";

export type LiveMember = {
  user_id: string;
  display_name: string;
  role: string;
  can_play: boolean;
  can_upload?: boolean;
  is_muted: boolean;
  joined_at?: string;
};

export function useRoomMembersLive(
  roomId: string,
  initialMembers: LiveMember[],
) {
  const [members, setMembers] = useState(initialMembers);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

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
            const nextRow: LiveMember = {
              user_id: row.user_id,
              display_name: row.display_name,
              role: row.role,
              can_play: row.can_play,
              can_upload: row.can_upload,
              is_muted: row.is_muted,
              joined_at: row.joined_at,
            };
            if (idx === -1) return [...prev, nextRow];
            const next = [...prev];
            next[idx] = { ...prev[idx], ...nextRow };
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
