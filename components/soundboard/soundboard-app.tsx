"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  deleteSound,
  renameSound,
  updateSoundVolume,
} from "@/app/actions/sounds";
import { randomUUID } from "@/lib/crypto/random-uuid";
import { createClient } from "@/lib/supabase/client";
import { useLiveBoardCatalog } from "@/hooks/use-live-board-catalog";
import { useRealtimeRoom } from "@/hooks/use-realtime-room";
import { useFavoriteSounds } from "@/hooks/use-favorite-sounds";
import { useSignedMediaUrls } from "@/hooks/use-signed-media-urls";
import { useSoundCooldown } from "@/hooks/use-sound-cooldown";
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
import { VolumeSlider } from "@/components/soundboard/volume-slider";
import type { ManageableMember } from "@/components/rooms/member-manage-list";
import { ErrorAlert } from "@/components/ui/error-alert";
import { E, type AppError, withMessage } from "@/lib/errors/catalog";
import { mapPlaybackError } from "@/lib/errors/messages";
import {
  canUserPlay,
  canUserUpload,
  isOwnerOrAdmin,
} from "@/lib/permissions/room-permissions";
import type { RoomRole } from "@/types/database";

type Category = { id: string; name: string };

export function SoundboardApp({
  roomId,
  roomName,
  roomDescription,
  roomCode,
  masterVolume,
  maxSimultaneous,
  guestCanPlay,
  uploadEnabled,
  role,
  canPlayFlag,
  canUploadFlag,
  isMuted,
  userId,
  displayName,
  sounds,
  categories,
  members,
}: {
  roomId: string;
  roomName: string;
  roomDescription: string | null;
  roomCode: string;
  masterVolume: number;
  maxSimultaneous: number;
  guestCanPlay: boolean;
  uploadEnabled: boolean;
  role: RoomRole;
  canPlayFlag: boolean;
  canUploadFlag: boolean;
  isMuted: boolean;
  userId: string;
  displayName: string;
  sounds: BoardSound[];
  categories: Category[];
  members: ManageableMember[];
}) {
  const [deviceVolume, setDeviceVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [soundVolumes, setSoundVolumes] = useState<Record<string, number>>({});
  const [categoryId, setCategoryId] = useState<CategoryFilter>(
    () => categories[0]?.id ?? "favorites",
  );
  const [actionError, setActionError] = useState<AppError | null>(null);
  const [, startVolumeTransition] = useTransition();
  const { coolingIds, cooldownProgress, startCooldown } = useSoundCooldown();
  const { favoriteIds, toggleFavorite, isFavorite } = useFavoriteSounds(roomId);
  const {
    sounds: liveSounds,
    categories: liveCategories,
    upsertCategory,
  } = useLiveBoardCatalog(roomId, sounds, categories);

  const imageUrls = useSignedMediaUrls({
    roomId,
    kind: "image",
    paths: liveSounds.map((s) => s.image_path),
    enabled: true,
  });

  const canPlay = canUserPlay({
    role,
    canPlayFlag,
    isMuted,
    guestCanPlay,
  });
  const canManage = isOwnerOrAdmin(role);
  const canUpload = canUserUpload({
    role,
    canUploadFlag,
    uploadEnabled,
  });

  useEffect(() => {
    if (categoryId === "favorites") return;
    if (liveCategories.some((c) => c.id === categoryId)) return;
    setCategoryId(liveCategories[0]?.id ?? "favorites");
  }, [liveCategories, categoryId]);

  const soundsWithVolume = useMemo(
    () =>
      liveSounds.map((s) => ({
        ...s,
        volume: soundVolumes[s.id] ?? Number(s.volume),
      })),
    [liveSounds, soundVolumes],
  );

  const filtered = useMemo(() => {
    if (categoryId === "favorites") {
      return soundsWithVolume.filter((s) => favoriteIds.includes(s.id));
    }
    return soundsWithVolume.filter((s) => s.category_id === categoryId);
  }, [soundsWithVolume, categoryId, favoriteIds]);

  const soundNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of liveSounds) map[s.id] = s.name;
    return map;
  }, [liveSounds]);

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
    preloadAll,
    preloadState,
    playingIds,
    lastError,
    history,
  } = useRealtimeRoom({
    roomId,
    // Full board catalog so filtered views still hear other members' plays.
    sounds: soundsWithVolume.map((s) => ({
      id: s.id,
      audio_path: s.audio_path,
      volume: Number(s.volume),
      name: s.name,
      playback_mode: s.playback_mode ?? "one_shot",
    })),
    memberNames,
    roomVolume: masterVolume,
    deviceOrObsVolume: muted ? 0 : deviceVolume,
    maxSimultaneous,
    enabled: true,
  });

  const handleVolumeChange = useCallback((soundId: string, volume: number) => {
    setSoundVolumes((prev) => ({ ...prev, [soundId]: volume }));
  }, []);

  const handleVolumeCommit = useCallback(
    (soundId: string, volume: number) => {
      setSoundVolumes((prev) => ({ ...prev, [soundId]: volume }));
      startVolumeTransition(async () => {
        const result = await updateSoundVolume(soundId, volume);
        if (!result.ok) {
          setActionError({ code: result.code, message: result.error });
        }
      });
    },
    [],
  );

  const handleDeleteSound = useCallback(async (soundId: string) => {
    setActionError(null);
    const result = await deleteSound(soundId);
    if (!result.ok) {
      setActionError({ code: result.code, message: result.error });
      return false;
    }
    setSoundVolumes((prev) => {
      const next = { ...prev };
      delete next[soundId];
      return next;
    });
    return true;
  }, []);

  const handleRenameSound = useCallback(
    async (soundId: string, name: string) => {
      setActionError(null);
      const result = await renameSound(soundId, name);
      if (!result.ok) {
        setActionError({ code: result.code, message: result.error });
        return false;
      }
      return true;
    },
    [],
  );

  const emitPlay = useCallback(
    async (sound: BoardSound) => {
      setActionError(null);
      if (!canPlay) {
        setActionError(E.PLAY_DENIED);
        return;
      }
      const isLoop = (sound.playback_mode ?? "one_shot") === "toggle_loop";
      if (!isLoop && coolingIds[sound.id]) {
        setActionError(
          withMessage(
            E.PLAY_COOLDOWN,
            "クールダウン中です。少し待ってから押してください。",
          ),
        );
        return;
      }

      // First pad tap doubles as the browser audio unlock gesture.
      if (!audioUnlocked) {
        const ok = await unlockAudio();
        if (!ok) {
          setActionError(lastError ?? E.AUDIO_UNLOCK_FAILED);
          return;
        }
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

      if (!isLoop) {
        startCooldown(sound.id, sound.cooldown_ms);
      }
    },
    [
      audioUnlocked,
      canPlay,
      coolingIds,
      lastError,
      roomId,
      startCooldown,
      unlockAudio,
    ],
  );

  const emitStop = useCallback(
    async (sound: BoardSound) => {
      if ((sound.playback_mode ?? "one_shot") !== "toggle_loop") return;
      const supabase = createClient();
      const { error } = await supabase.rpc("create_playback_event", {
        p_room_id: roomId,
        p_sound_id: sound.id,
        p_action: "stop",
        p_volume: 1,
        p_client_event_id: randomUUID(),
      });
      if (error) {
        console.error("[board] stop rejected", error.code, error.message);
      }
    },
    [roomId],
  );

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

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[linear-gradient(180deg,#fff7fb_0%,#eef9ff_45%,#fff7fb_100%)]">
      <header className="space-y-3 border-b border-border/70 bg-white/75 px-4 py-3 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-display truncate text-xl font-semibold tracking-tight">
              {roomName}
            </h1>
            {roomDescription?.trim() ? (
              <p className="line-clamp-2 text-sm font-semibold text-muted-foreground">
                {roomDescription.trim()}
              </p>
            ) : null}
          </div>
          <ConnectionStatusBadge status={connectionStatus} />
          {canManage && <StopAllButton onStopAll={emitStopAll} />}
        </div>
        {!audioUnlocked && (
          <p className="rounded-xl border border-[var(--hub-coral)]/25 bg-[linear-gradient(90deg,#fff7fb,#ffffff)] px-3 py-2 text-xs font-bold text-muted-foreground">
            最初のパッドを押すと音声がオンになります
          </p>
        )}
        {liveSounds.length === 0 && liveCategories.length === 0 && (
          <p className="flex items-center gap-2 rounded-xl border border-sky-200/80 bg-sky-50/90 px-3 py-2 text-xs font-bold text-sky-900">
            <span
              className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-sky-300 border-t-sky-700"
              aria-hidden
            />
            初期サウンドを準備中です。まもなくパッドに表示されます
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--hub-coral)]/25 bg-[linear-gradient(90deg,#fff7fb,#ffffff)] px-3 py-2.5">
          <VolumeSlider
            id="master-device-volume"
            label="全体ボリューム"
            value={muted ? 0 : deviceVolume}
            onChange={(v) => {
              setMuted(false);
              setDeviceVolume(v);
            }}
            className="min-w-[14rem] flex-1"
          />
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
      </header>

      {(actionError || lastError) && (
        <div className="px-4 pt-3">
          <ErrorAlert error={actionError ?? lastError} />
        </div>
      )}

      <div className="grid flex-1 gap-4 p-4 lg:grid-cols-[160px_minmax(0,1fr)_320px]">
        <CategoryRail
          roomId={roomId}
          categories={liveCategories}
          categoryId={categoryId}
          canManage={canManage}
          onChange={setCategoryId}
          onCategoryCreated={upsertCategory}
          onError={setActionError}
        />

        <section className="space-y-4">
          <CategoryChips
            roomId={roomId}
            categories={liveCategories}
            categoryId={categoryId}
            canManage={canManage}
            onChange={setCategoryId}
            onCategoryCreated={upsertCategory}
            onError={setActionError}
          />
          <SoundGrid
            roomId={roomId}
            categories={liveCategories}
            sounds={filtered}
            canUpload={canUpload}
            canDelete={canManage}
            showAddSlots={categoryId !== "favorites"}
            defaultCategoryId={
              categoryId !== "favorites" ? categoryId : ""
            }
            emptyMessage={
              categoryId === "favorites"
                ? "お気に入りはまだありません。パッド右上の☆で追加できます。"
                : "このパッドにはまだサウンドがありません。末尾の＋から追加できます。"
            }
            imageUrls={imageUrls}
            playingIds={playingIds}
            coolingIds={coolingIds}
            cooldownProgress={cooldownProgress}
            canPlay={canPlay}
            isFavorite={isFavorite}
            preloadState={preloadState}
            onPreloadAll={() => void preloadAll()}
            onPlay={(sound) => void emitPlay(sound)}
            onStop={(sound) => void emitStop(sound)}
            onToggleFavorite={toggleFavorite}
            onDelete={canManage ? handleDeleteSound : undefined}
            onRename={canManage ? handleRenameSound : undefined}
            onVolumeChange={canManage ? handleVolumeChange : undefined}
            onVolumeCommit={canManage ? handleVolumeCommit : undefined}
          />
        </section>

        <div className="space-y-4">
          <ParticipantsPanel
            roomId={roomId}
            roomCode={roomCode}
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
