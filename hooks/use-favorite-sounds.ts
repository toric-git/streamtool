"use client";

import { useState } from "react";

const storageKey = (roomId: string) => `rsb:favorites:${roomId}`;

function readFavorites(roomId: string): string[] {
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

/** Persists favorite sound IDs per room in localStorage (device-local only). */
export function useFavoriteSounds(roomId: string) {
  const [cachedRoomId, setCachedRoomId] = useState(roomId);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    readFavorites(roomId),
  );

  if (cachedRoomId !== roomId) {
    setCachedRoomId(roomId);
    setFavoriteIds(readFavorites(roomId));
  }

  function persist(next: string[]) {
    setFavoriteIds(next);
    try {
      localStorage.setItem(storageKey(roomId), JSON.stringify(next));
    } catch {
      // ignore quota / private mode
    }
  }

  function toggleFavorite(soundId: string) {
    persist(
      favoriteIds.includes(soundId)
        ? favoriteIds.filter((id) => id !== soundId)
        : [...favoriteIds, soundId],
    );
  }

  function isFavorite(soundId: string) {
    return favoriteIds.includes(soundId);
  }

  return { favoriteIds, toggleFavorite, isFavorite };
}
