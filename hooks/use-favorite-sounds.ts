"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  listFavoriteSoundIds,
  toggleFavoriteSound,
} from "@/app/actions/favorites";
import { createClient } from "@/lib/supabase/client";

const storageKey = (roomId: string) => `rsb:favorites:${roomId}`;

function readLocal(roomId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(roomId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

function writeLocal(roomId: string, ids: string[]) {
  try {
    localStorage.setItem(storageKey(roomId), JSON.stringify(ids));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Favorites sync to the signed-in account (DB) with localStorage as cache/offline fallback.
 */
export function useFavoriteSounds(roomId: string) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    readLocal(roomId),
  );
  const [, startTransition] = useTransition();

  useEffect(() => {
    setFavoriteIds(readLocal(roomId));
    let cancelled = false;
    startTransition(async () => {
      const result = await listFavoriteSoundIds(roomId);
      if (cancelled || !result.ok || !result.data) return;
      setFavoriteIds(result.data.soundIds);
      writeLocal(roomId, result.data.soundIds);
    });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`favorites:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sound_favorites",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          void listFavoriteSoundIds(roomId).then((result) => {
            if (!result.ok || !result.data) return;
            setFavoriteIds(result.data.soundIds);
            writeLocal(roomId, result.data.soundIds);
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  const toggleFavorite = useCallback(
    (soundId: string) => {
      const next = favoriteIds.includes(soundId)
        ? favoriteIds.filter((id) => id !== soundId)
        : [...favoriteIds, soundId];
      setFavoriteIds(next);
      writeLocal(roomId, next);
      startTransition(async () => {
        const result = await toggleFavoriteSound(roomId, soundId);
        if (!result.ok) {
          // Revert optimistic update from server truth.
          const listed = await listFavoriteSoundIds(roomId);
          if (listed.ok && listed.data) {
            setFavoriteIds(listed.data.soundIds);
            writeLocal(roomId, listed.data.soundIds);
          }
        }
      });
    },
    [favoriteIds, roomId],
  );

  const isFavorite = useCallback(
    (soundId: string) => favoriteIds.includes(soundId),
    [favoriteIds],
  );

  return { favoriteIds, toggleFavorite, isFavorite };
}
