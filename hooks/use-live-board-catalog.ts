"use client";

import { useEffect, useMemo, useState } from "react";
import type { BoardSound } from "@/components/soundboard/sound-grid";
import { createClient } from "@/lib/supabase/client";

export type LiveCategory = { id: string; name: string; sort_order?: number };

type SoundRow = BoardSound & {
  approval_status?: string;
  is_active?: boolean;
  sort_order?: number;
  playback_mode?: "one_shot" | "toggle_loop";
};

function isVisibleSound(row: SoundRow): boolean {
  if (row.approval_status != null && row.approval_status !== "approved") {
    return false;
  }
  if (row.is_active === false) return false;
  return Boolean(row.id && row.audio_path && row.name);
}

function toBoardSound(row: SoundRow): BoardSound {
  return {
    id: row.id,
    name: row.name,
    audio_path: row.audio_path,
    button_color: row.button_color,
    text_color: row.text_color,
    image_path: row.image_path,
    volume: Number(row.volume),
    cooldown_ms: row.cooldown_ms,
    category_id: row.category_id,
    playback_mode:
      row.playback_mode === "toggle_loop" ? "toggle_loop" : "one_shot",
    sort_order: row.sort_order,
  };
}

/**
 * Keeps pad sheets (categories) and sounds in sync for all room members
 * via Supabase Realtime. Requires sound_categories in the realtime publication.
 */
export function useLiveBoardCatalog(
  roomId: string,
  initialSounds: BoardSound[],
  initialCategories: LiveCategory[],
) {
  const [sounds, setSounds] = useState(initialSounds);
  const [categories, setCategories] = useState(initialCategories);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    setSounds(initialSounds);
  }, [initialSounds]);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`board-catalog:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sounds",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id?: string };
            if (!oldRow.id) return;
            setSounds((prev) => prev.filter((s) => s.id !== oldRow.id));
            return;
          }

          const row = payload.new as SoundRow;
          if (!row?.id) return;

          setSounds((prev) => {
            if (!isVisibleSound(row)) {
              return prev.filter((s) => s.id !== row.id);
            }
            const nextSound = toBoardSound(row);
            const idx = prev.findIndex((s) => s.id === row.id);
            if (idx === -1) return [...prev, nextSound];
            const next = [...prev];
            next[idx] = { ...prev[idx], ...nextSound };
            return next;
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sound_categories",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id?: string };
            if (!oldRow.id) return;
            setCategories((prev) => prev.filter((c) => c.id !== oldRow.id));
            return;
          }

          const row = payload.new as LiveCategory;
          if (!row?.id || !row.name) return;
          setCategories((prev) => {
            const idx = prev.findIndex((c) => c.id === row.id);
            const nextRow = {
              id: row.id,
              name: row.name,
              sort_order: row.sort_order,
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

  const sortedCategories = useMemo(
    () =>
      [...categories].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      ),
    [categories],
  );

  return { sounds, categories: sortedCategories };
}
