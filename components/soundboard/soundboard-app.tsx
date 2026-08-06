"use client";

import { useMemo, useState } from "react";
import { randomUUID } from "@/lib/crypto/random-uuid";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRoom } from "@/hooks/use-realtime-room";
import { useFavoriteSounds } from "@/hooks/use-favorite-sounds";
import { useSignedMediaUrls } from "@/hooks/use-signed-media-urls";
import { useSoundCooldown } from "@/hooks/use-sound-cooldown";
import { AudioEnableGate } from "@/components/soundboard/audio-enable-gate";
import {
  CategoryChips,
  CategoryRail,
  type CategoryFilter,
} from "@/components/soundboard/category-rail";
import { ConnectionStatusBadge } from "@/components/soundboard/connection-status";
import { ParticipantsPanel } from "@/components/soundboard/participants-panel";
import { PlaybackHistory } from "@/components/soundboard/playback-history";
import {
  SoundGrid,
  type BoardSound,
} from "@/components/soundboard/sound-grid";
import { StopAllButton } from "@/components/soundboard/stop-all-button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Label } from "@/components/ui/label";
import { E, type AppError, withMessage } from "@/lib/errors/catalog";
import { mapPlaybackError } from "@/lib/errors/messages";
import { canUserPlay, isOwnerOrAdmin } from "@/lib/permissions/room-permissions";
import type { RoomRole } from "@/types/database";

type Category = { id: string; name: string };

type Member = {
  user_id: string;
  display_name: string;
  role: string;
  can_play: boolean;
  is_muted: boolean;
};

export function SoundboardApp({
  roomId,
  roomName,
  roomCode,
  masterVolume,
  maxSimultaneous,
  guestCanPlay,
  role,
  canPlayFlag,
  isMuted,
  userId,
  displayName,
  sounds,
  categories,
  members,
}: {
  roomId: string;
  roomName: string;
  roomCode: string;
  masterVolume: number;
  maxSimultaneous: number;
  guestCanPlay: boolean;
  role: RoomRole;
  canPlayFlag: boolean;
  isMuted: boolean;
  userId: string;
  displayName: string;
  sounds: BoardSound[];
  categories: Category[];
  members: Member[];
}) {
  const [deviceVolume, setDeviceVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [categoryId, setCategoryId] = useState<CategoryFilter>("all");
  const [actionError, setActionError] = useState<AppError | null>(null);
  const { coolingIds, cooldownProgress, startCooldown } = useSoundCooldown();
  const { favoriteIds, toggleFavorite, isFavorite } = useFavoriteSounds(roomId);
  const imageUrls = useSignedMediaUrls({
    roomId,
    kind: "image",
    paths: sounds.map((s) => s.image_path),
    enabled: true,
  });

  const canPlay = canUserPlay({
    role,
    canPlayFlag,
    isMuted,
    guestCanPlay,
  });
  const canStopAll = isOwnerOrAdmin(role);

  const filtered = useMemo(() => {
    if (categoryId === "all") return sounds;
    if (categoryId === "favorites") {
      return sounds.filter((s) => favoriteIds.includes(s.id));
    }
    return sounds.filter((s) => s.category_id === categoryId);
  }, [sounds, categoryId, favoriteIds]);

  const soundNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of sounds) map[s.id] = s.name;
    return map;
  }, [sounds]);

  const memberNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) map[m.user_id] = m.display_name;
    map[userId] = displayName;
    return map;
  }, [members, userId, displayName]);

  const {
    connectionStatus,
    audioUnlocked,
    unlockAudio,
    playingIds,
    lastError,
    history,
  } = useRealtimeRoom({
    roomId,
    sounds: filtered.map((s) => ({
      id: s.id,
      audio_path: s.audio_path,
      volume: Number(s.volume),
      name: s.name,
    })),
    memberNames,
    roomVolume: masterVolume,
    deviceOrObsVolume: muted ? 0 : deviceVolume,
    maxSimultaneous,
    enabled: true,
  });

  async function emitPlay(sound: BoardSound) {
    setActionError(null);
    if (!canPlay) {
      setActionError(E.PLAY_DENIED);
      return;
    }
    if (coolingIds[sound.id]) {
      setActionError(
        withMessage(E.PLAY_COOLDOWN, "クールダウン中です。少し待ってから押してください。"),
      );
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.rpc("create_playback_event", {
      p_room_id: roomId,
      p_sound_id: sound.id,
      p_action: "play",
      p_volume: 1,
      p_client_event_id: randomUUID(),
    });

    if (error) {
      const mapped = mapPlaybackError(error.message);
      console.error("[board]", mapped.code, error.code, error.message);
      setActionError(mapped);
      return;
    }

    startCooldown(sound.id, sound.cooldown_ms);
  }

  async function emitStopAll() {
    const supabase = createClient();
    const { error } = await supabase.rpc("create_playback_event", {
      p_room_id: roomId,
      p_sound_id: null,
      p_action: "stop_all",
      p_volume: 1,
      p_client_event_id: randomUUID(),
    });
    if (error) {
      console.error("[board] stop_all rejected", error.code);
      throw new Error(error.message);
    }
  }

  if (!audioUnlocked) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[radial-gradient(ellipse_at_top,rgba(255,77,141,0.15),transparent_50%),linear-gradient(180deg,#fff7fb,#e8f7ff)] p-6">
        <AudioEnableGate
          onEnable={async () => {
            await unlockAudio();
          }}
          error={lastError}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[linear-gradient(180deg,#fff7fb_0%,#eef9ff_45%,#fff7fb_100%)]">
      <header className="flex flex-wrap items-center gap-3 border-b border-border/70 bg-white/75 px-4 py-3 backdrop-blur-sm">
        <div className="min-w-0 flex-1">
          <h1 className="font-display truncate text-xl font-semibold tracking-tight">
            {roomName}
          </h1>
          <p className="text-xs font-bold text-muted-foreground">
            コード {roomCode} · 大きいボタンを押すだけ
          </p>
        </div>
        <ConnectionStatusBadge status={connectionStatus} />
        {canStopAll && <StopAllButton onStopAll={emitStopAll} />}
      </header>

      {(actionError || lastError) && (
        <div className="px-4 pt-3">
          <ErrorAlert
            error={
              actionError ??
              withMessage(E.PLAY_FAILED, lastError ?? E.PLAY_FAILED.message)
            }
          />
        </div>
      )}

      <div className="grid flex-1 gap-4 p-4 lg:grid-cols-[180px_1fr_280px]">
        <CategoryRail
          categories={categories}
          categoryId={categoryId}
          onChange={setCategoryId}
        />

        <section className="space-y-4">
          <CategoryChips
            categories={categories}
            categoryId={categoryId}
            onChange={setCategoryId}
          />
          <SoundGrid
            sounds={filtered}
            emptyMessage={
              categoryId === "favorites"
                ? "お気に入りはまだありません。ボタン右上の☆で追加できます。"
                : "表示できるサウンドがありません。"
            }
            imageUrls={imageUrls}
            playingIds={playingIds}
            coolingIds={coolingIds}
            cooldownProgress={cooldownProgress}
            canPlay={canPlay}
            isFavorite={isFavorite}
            onPlay={(sound) => void emitPlay(sound)}
            onToggleFavorite={toggleFavorite}
          />

          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/80 bg-white/90 p-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="deviceVolume" className="font-bold">
                端末音量 {Math.round(deviceVolume * 100)}%
              </Label>
              <input
                id="deviceVolume"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={deviceVolume}
                onChange={(e) => setDeviceVolume(Number(e.target.value))}
                className="w-40 accent-[var(--hub-coral)]"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={muted}
                onChange={(e) => setMuted(e.target.checked)}
                className="size-4 accent-[var(--hub-coral)]"
              />
              ミュート
            </label>
          </div>
        </section>

        <div className="space-y-4">
          <ParticipantsPanel
            roomId={roomId}
            userId={userId}
            displayName={displayName}
            role={role}
            members={members}
          />
          <PlaybackHistory events={history} soundNames={soundNames} />
        </div>
      </div>
    </div>
  );
}
