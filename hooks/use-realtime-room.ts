"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AudioEngine, type AudioEngineLike, type PlayRequest } from "@/lib/audio/audio-engine";
import {
  markClientEventSeen,
  shouldPlayClientEvent,
} from "@/lib/audio/playback-math";
import { REALTIME_LIMITS } from "@/lib/app-config";
import { fetchSignedMediaUrl } from "@/lib/media/signed-url-client";
import type { ConnectionStatus, PlaybackEventPayload } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

type SoundMeta = {
  id: string;
  audio_path: string;
  volume: number;
  name: string;
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
  const [lastError, setLastError] = useState<string | null>(null);
  const [history, setHistory] = useState<PlaybackEventPayload[]>([]);

  const seenIdsRef = useRef(new Set<string>());
  const engineRef = useRef<AudioEngineLike | null>(null);
  const soundsRef = useRef(sounds);
  const memberNamesRef = useRef(memberNames);

  useEffect(() => {
    soundsRef.current = sounds;
  }, [sounds]);

  useEffect(() => {
    memberNamesRef.current = memberNames;
  }, [memberNames]);

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
      volumeLayers: { roomVolume, deviceOrObsVolume },
    });

    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [roomId, maxSimultaneous, isObs, obsToken, roomVolume, deviceOrObsVolume]);

  useEffect(() => {
    engineRef.current?.setVolumeLayers({ roomVolume, deviceOrObsVolume });
  }, [roomVolume, deviceOrObsVolume]);

  useEffect(() => {
    if (!enabled || !audioUnlocked) return;

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
            !shouldPlayClientEvent({
              clientEventId: event.clientEventId,
              seenIds: seenIdsRef.current,
              createdAt: event.createdAt,
              maxAgeMs: REALTIME_LIMITS.maxEventAgeMs,
            })
          ) {
            return;
          }
          markClientEventSeen(seenIdsRef.current, event.clientEventId);

          onEvent?.(event);
          setHistory((prev) => [event, ...prev].slice(0, REALTIME_LIMITS.historyLimit));

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
              };
              await engineRef.current?.play(req);
              setPlayingIds(engineRef.current?.getPlayingSoundIds() ?? []);
            }
          } catch (err) {
            console.error("[realtime] playback failed", err instanceof Error ? err.message : "error");
            setLastError("音声の再生に失敗しました。再読み込みするか、音声を有効化してください。");
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
  }, [supabase, roomId, enabled, audioUnlocked, onEvent]);

  // Prefetch visible sounds after unlock
  useEffect(() => {
    if (!audioUnlocked || !enabled) return;
    const top = sounds.slice(0, 12);
    void Promise.allSettled(
      top.map((s) => engineRef.current?.preload(s.id, s.audio_path)),
    );
  }, [audioUnlocked, enabled, sounds]);

  async function unlockAudio() {
    const ok = await engineRef.current?.unlock();
    setAudioUnlocked(Boolean(ok));
    if (!ok) {
      setLastError("音声の有効化に失敗しました。ブラウザの設定を確認してください。");
    }
    return Boolean(ok);
  }

  return {
    connectionStatus,
    audioUnlocked,
    unlockAudio,
    playingIds,
    lastError,
    history,
    stopAllLocal: () => engineRef.current?.stopAll(),
  };
}
