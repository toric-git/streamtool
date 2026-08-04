"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ConnectionStatus } from "@/types/database";

export type PresenceUser = {
  userId: string;
  displayName: string;
  role?: string;
  onlineAt: string;
  isObs?: boolean;
};

type Options = {
  roomId: string;
  userId: string;
  displayName: string;
  role?: string;
  enabled?: boolean;
};

export function useRoomPresence({
  roomId,
  userId,
  displayName,
  role,
  enabled = true,
}: Options) {
  const [participants, setParticipants] = useState<PresenceUser[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>(() =>
    enabled ? "connecting" : "disconnected",
  );

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!enabled || !roomId || !userId) {
      return;
    }

    let cancelled = false;
    const channel = supabase.channel(`room-presence:${roomId}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const list: PresenceUser[] = [];
        for (const key of Object.keys(state)) {
          const metas = state[key];
          const latest = metas?.[metas.length - 1];
          if (latest) list.push(latest);
        }
        list.sort((a, b) => a.displayName.localeCompare(b.displayName, "ja"));
        if (!cancelled) setParticipants(list);
      })
      .subscribe(async (subscribeStatus) => {
        if (cancelled) return;
        if (subscribeStatus === "SUBSCRIBED") {
          setStatus("connected");
          await channel.track({
            userId,
            displayName,
            role,
            onlineAt: new Date().toISOString(),
            isObs: false,
          } satisfies PresenceUser);
        } else if (subscribeStatus === "CHANNEL_ERROR") {
          setStatus("disconnected");
        } else if (subscribeStatus === "TIMED_OUT") {
          setStatus("reconnecting");
        } else if (subscribeStatus === "CLOSED") {
          setStatus("disconnected");
        }
      });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [supabase, roomId, userId, displayName, role, enabled]);

  return { participants, status };
}
