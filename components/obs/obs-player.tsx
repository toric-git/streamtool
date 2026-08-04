"use client";

import { useEffect, useMemo, useState } from "react";
import { OBS_DISPLAY_NAME } from "@/lib/rooms/members";
import { useRealtimeRoom } from "@/hooks/use-realtime-room";
import { createClient } from "@/lib/supabase/client";
import type { PlaybackEventPayload } from "@/types/database";

type Sound = {
  id: string;
  name: string;
  audio_path: string;
  volume: number;
  cooldown_ms: number;
};

type RoomInfo = {
  id: string;
  name: string;
  masterVolume: number;
  obsVolume: number;
  maxSimultaneous: number;
};

export function ObsPlayer({
  roomId,
  token,
  debug,
}: {
  roomId: string;
  token: string;
  debug: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [ready, setReady] = useState(false);
  const [lastEvent, setLastEvent] = useState<PlaybackEventPayload | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/obs/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, token }),
      });
      const data = (await res.json()) as {
        error?: string;
        room?: RoomInfo;
        sounds?: Sound[];
      };
      if (cancelled) return;
      if (!res.ok || !data.room) {
        setError(data.error ?? "OBSトークンの検証に失敗しました。");
        return;
      }
      setRoom(data.room);
      setSounds(data.sounds ?? []);

      // Token-validated OBS clients join anonymously as an "OBS" member for Realtime RLS.

      const { data: authData, error: authError } = await supabase.auth.signInAnonymously({
        options: { data: { display_name: OBS_DISPLAY_NAME } },
      });
      if (authError || !authData.user) {
        setError(
          "OBS用セッションの作成に失敗しました。Anonymous Sign-Ins を有効にしてください。",
        );
        return;
      }

      const joinRes = await fetch("/api/obs/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, token }),
      });
      if (!joinRes.ok) {
        const joinJson = (await joinRes.json()) as { error?: string };
        setError(joinJson.error ?? "OBSセッションの準備に失敗しました。");
        return;
      }

      setReady(true);
    })().catch(() => {
      if (!cancelled) setError("OBSの初期化に失敗しました。");
    });

    return () => {
      cancelled = true;
    };
  }, [roomId, token, supabase]);

  const {
    connectionStatus,
    audioUnlocked,
    unlockAudio,
    lastError,
    history,
  } = useRealtimeRoom({
    roomId,
    sounds,
    roomVolume: room?.masterVolume ?? 1,
    deviceOrObsVolume: room?.obsVolume ?? 1,
    maxSimultaneous: room?.maxSimultaneous ?? 4,
    enabled: ready,
    isObs: true,
    obsToken: token,
    onEvent: setLastEvent,
  });

  useEffect(() => {
    if (!ready || audioUnlocked) return;
    void unlockAudio();
    // unlock once when session is ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, audioUnlocked]);

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600" style={{ background: "transparent" }}>
        {error}
      </div>
    );
  }

  if (!ready || !room) {
    return debug ? (
      <div className="p-2 text-xs text-white/80" style={{ background: "transparent" }}>
        OBS 初期化中…
      </div>
    ) : null;
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "transparent" }}
      data-obs-room={roomId}
    >
      {debug && (
        <div className="pointer-events-none fixed bottom-2 left-2 max-w-sm rounded bg-black/70 p-2 text-[11px] text-white">
          <p>room: {room.name}</p>
          <p>status: {connectionStatus}</p>
          <p>audio: {audioUnlocked ? "unlocked" : "locked"}</p>
          <p>last: {lastEvent?.action ?? "-"} / {history[0]?.soundId?.slice(0, 8) ?? "-"}</p>
          {lastError && <p>err: {lastError}</p>}
        </div>
      )}
    </div>
  );
}
