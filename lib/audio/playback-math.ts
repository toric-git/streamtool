import { clamp01 } from "@/lib/utils";

export type VolumeLayers = {
  soundVolume: number;
  roomVolume: number;
  deviceOrObsVolume: number;
  eventVolume: number;
};

/** Final gain = product of all layers, each clamped to 0..1. */
export function computePlaybackGain(layers: VolumeLayers): number {
  return clamp01(
    clamp01(layers.soundVolume) *
      clamp01(layers.roomVolume) *
      clamp01(layers.deviceOrObsVolume) *
      clamp01(layers.eventVolume),
  );
}

export function isEventTooOld(options: {
  createdAt: string | Date;
  nowMs?: number;
  maxAgeMs: number;
  /** Optional server clock offset (serverNow - clientNow). */
  serverOffsetMs?: number;
}): boolean {
  const createdMs =
    options.createdAt instanceof Date
      ? options.createdAt.getTime()
      : Date.parse(options.createdAt);
  if (Number.isNaN(createdMs)) return true;
  const now = (options.nowMs ?? Date.now()) + (options.serverOffsetMs ?? 0);
  return now - createdMs > options.maxAgeMs;
}

export function shouldPlayClientEvent(options: {
  clientEventId: string;
  seenIds: Set<string>;
  createdAt: string | Date;
  maxAgeMs: number;
  nowMs?: number;
}): boolean {
  if (options.seenIds.has(options.clientEventId)) return false;
  if (
    isEventTooOld({
      createdAt: options.createdAt,
      maxAgeMs: options.maxAgeMs,
      nowMs: options.nowMs,
    })
  ) {
    return false;
  }
  return true;
}

export function markClientEventSeen(
  seenIds: Set<string>,
  clientEventId: string,
  maxSize = 500,
): void {
  seenIds.add(clientEventId);
  if (seenIds.size <= maxSize) return;
  const first = seenIds.values().next().value;
  if (first !== undefined) seenIds.delete(first);
}

export function isCooldownActive(options: {
  lastPlayedAtMs: number | null;
  cooldownMs: number;
  nowMs?: number;
}): boolean {
  if (options.lastPlayedAtMs == null) return false;
  const now = options.nowMs ?? Date.now();
  return now - options.lastPlayedAtMs < options.cooldownMs;
}

export function cooldownRemainingMs(options: {
  lastPlayedAtMs: number | null;
  cooldownMs: number;
  nowMs?: number;
}): number {
  if (options.lastPlayedAtMs == null) return 0;
  const now = options.nowMs ?? Date.now();
  return Math.max(0, options.cooldownMs - (now - options.lastPlayedAtMs));
}
