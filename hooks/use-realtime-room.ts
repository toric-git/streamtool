"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AudioEngine, type AudioEngineLike, type PlayRequest } from "@/lib/audio/audio-engine";
import {
  isEventTooOld,
  markClientEventSeen,
} from "@/lib/audio/playback-math";
import { REALTIME_LIMITS } from "@/lib/app-config";
import { E, type AppError } from "@/lib/errors/catalog";
import { fetchSignedMediaUrl } from "@/lib/media/signed-url-client";
import type { ConnectionStatus, PlaybackEventPayload } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

type SoundMeta = {
  id: string;
  audio_path: string;
  volume: number;
  name: string;
  playback_mode?: "one_shot" | "toggle_loop";
};

type Options = {
  roomId: string;
  sounds: SoundMeta[];
  memberNames?: Record<string, string>;
  roomVolume: number;
  deviceOrObsVolume: number;
  maxSimultaneous: number;
  enabled: boolean;
  isObs?: boolean;
  obsToken?: string;
  onEvent?: (event: PlaybackEventPayload) => void;
};

export function useRealtimeRoom({
  roomId,
  sounds,
  memberNames = {},
  roomVolume,
  deviceOrObsVolume,
  maxSimultaneous,
  enabled,
  isObs = false,
  obsToken,
  onEvent,
}: Options) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [playingIds, setPlayingIds] = useState<string[]>([]);
  const [lastError, setLastError] = useState<AppError | null>(null);
  const [history, setHistory] = useState<PlaybackEventPayload[]>([]);
  const [preloadState, setPreloadState] = useState<
    "idle" | "loading" | "done"
  >("idle");

  const seenIdsRef = useRef(new Set<string>());
  const historySeenRef = useRef(new Set<string>());
  const engineRef = useRef<AudioEngineLike | null>(null);
  const soundsRef = useRef(sounds);
  const memberNamesRef = useRef(memberNames);
  const volumeLayersRef = useRef({ roomVolume, deviceOrObsVolume });
  const soundIdsKey = sounds.map((s) => s.id).join(",");

  useEffect(() => {
    soundsRef.current = sounds;
  }, [sounds]);

  useEffect(() => {
    setPreloadState("idle");
  }, [soundIdsKey]);

  useEffect(() => {
    memberNamesRef.current = memberNames;
  }, [memberNames]);

  useEffect(() => {
    volumeLayersRef.current = { roomVolume, deviceOrObsVolume };
  }, [roomVolume, deviceOrObsVolume]);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const getSignedUrl = async (audioPath: string) => {
      const result = await fetchSignedMediaUrl({
        roomId,
        path: audioPath,
        kind: "audio",
        obsToken: isObs ? obsToken : undefined,
      });
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.signedUrl;
    };

    engineRef.current = new AudioEngine({
      maxSimultaneous,
      getSignedUrl,
      volumeLayers: { ...volumeLayersRef.current },
    });

    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [roomId, maxSimultaneous, isObs, obsToken]);

  useEffect(() => {
    engineRef.current?.setVolumeLayers({ roomVolume, deviceOrObsVolume });
  }, [roomVolume, deviceOrObsVolume]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const channel = supabase
      .channel(`playback:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "playback_events",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const row = payload.new as {
            id: string;
            room_id: string;
            sound_id: string | null;
            user_id: string;
            action: "play" | "stop" | "stop_all";
            volume: number;
            client_event_id: string;
            created_at: string;
          };

          const sound = soundsRef.current.find((s) => s.id === row.sound_id);
          const event: PlaybackEventPayload = {
            id: row.id,
            clientEventId: row.client_event_id,
            roomId: row.room_id,
            soundId: row.sound_id,
            userId: row.user_id,
            userDisplayName:
              memberNamesRef.current[row.user_id] ?? "メンバー",
            action: row.action,
            volume: Number(row.volume),
            createdAt: row.created_at,
          };

          if (
            isEventTooOld({
              createdAt: event.createdAt,
              maxAgeMs: REALTIME_LIMITS.maxEventAgeMs,
            })
          ) {
            return;
          }

          // Optimistic local play marks clientEventId first so Realtime does not
          // double-play; history still records the server event once.
          const alreadyPlayedLocally = seenIdsRef.current.has(
            event.clientEventId,
          );
          if (!alreadyPlayedLocally) {
            markClientEventSeen(seenIdsRef.current, event.clientEventId);
          }

          if (!historySeenRef.current.has(event.clientEventId)) {
            markClientEventSeen(historySeenRef.current, event.clientEventId);
            onEvent?.(event);
            setHistory((prev) =>
              [event, ...prev].slice(0, REALTIME_LIMITS.historyLimit),
            );
          }

          if (alreadyPlayedLocally) {
            return;
          }

          // Audio playback needs a prior user gesture; history still updates.
          if (!engineRef.current?.isUnlocked()) {
            return;
          }

          try {
            if (event.action === "stop_all") {
              engineRef.current?.stopAll();
              setPlayingIds([]);
              return;
            }
            if (event.action === "stop" && event.soundId) {
              engineRef.current?.stop(event.soundId);
              setPlayingIds((ids) => ids.filter((id) => id !== event.soundId));
              return;
            }
            if (event.action === "play" && event.soundId && sound) {
              const req: PlayRequest = {
                soundId: event.soundId,
                audioPath: sound.audio_path,
                soundVolume: Number(sound.volume),
                eventVolume: event.volume,
                clientEventId: event.clientEventId,
                loop: sound.playback_mode === "toggle_loop",
              };
              await engineRef.current?.play(req);
              setPlayingIds(engineRef.current?.getPlayingSoundIds() ?? []);
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : "error";
            console.error("[realtime]", E.AUDIO_PLAYBACK_FAILED.code, message);
            setLastError(
              message === "audio_locked" ? E.AUDIO_LOCKED : E.AUDIO_PLAYBACK_FAILED,
            );
          }
        },
      )
      .subscribe((status) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") setConnectionStatus("connected");
        else if (status === "CHANNEL_ERROR") setConnectionStatus("disconnected");
        else if (status === "TIMED_OUT") setConnectionStatus("reconnecting");
        else if (status === "CLOSED") setConnectionStatus("disconnected");
      });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [supabase, roomId, enabled, onEvent]);

  async function unlockAudio() {
    const engine = engineRef.current;
    if (!engine) {
      setLastError(E.AUDIO_ENGINE_NOT_READY);
      return false;
    }
    const ok = await engine.unlock();
    setAudioUnlocked(ok);
    if (!ok) {
      setLastError(E.AUDIO_UNLOCK_FAILED);
    } else {
      setLastError(null);
    }
    return ok;
  }

  /** Play immediately on this device; mark id so Realtime echo does not double-play. */
  async function playLocal(request: PlayRequest): Promise<boolean> {
    const engine = engineRef.current;
    if (!engine || !engine.isUnlocked()) {
      setLastError(E.AUDIO_ENGINE_NOT_READY);
      return false;
    }
    markClientEventSeen(seenIdsRef.current, request.clientEventId);
    try {
      await engine.play(request);
      setPlayingIds(engine.getPlayingSoundIds());
      setLastError(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "error";
      console.error("[audio]", E.AUDIO_PLAYBACK_FAILED.code, message);
      setLastError(
        message === "audio_locked" ? E.AUDIO_LOCKED : E.AUDIO_PLAYBACK_FAILED,
      );
      return false;
    }
  }

  function stopLocal(soundId: string, clientEventId: string) {
    markClientEventSeen(seenIdsRef.current, clientEventId);
    engineRef.current?.stop(soundId);
    setPlayingIds(engineRef.current?.getPlayingSoundIds() ?? []);
  }

  function stopAllLocal(clientEventId?: string) {
    if (clientEventId) {
      markClientEventSeen(seenIdsRef.current, clientEventId);
    }
    engineRef.current?.stopAll();
    setPlayingIds([]);
  }

  async function preloadAll(): Promise<boolean> {
    const engine = engineRef.current;
    if (!engine || !audioUnlocked) {
      setLastError(E.AUDIO_ENGINE_NOT_READY);
      return false;
    }
    setPreloadState("loading");
    setLastError(null);
    const results = await Promise.allSettled(
      soundsRef.current.map((s) => engine.preload(s.id, s.audio_path)),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    setPreloadState(
      failed === results.length && results.length > 0 ? "idle" : "done",
    );
    if (failed > 0 && failed === results.length) {
      setLastError(E.AUDIO_PLAYBACK_FAILED);
      return false;
    }
    return true;
  }

  return {
    connectionStatus,
    audioUnlocked,
    unlockAudio,
    playLocal,
    stopLocal,
    stopAllLocal,
    preloadAll,
    preloadState,
    playingIds,
    lastError,
    history,
  };
}
