import { describe, expect, it } from "vitest";
import {
  computePlaybackGain,
  isEventTooOld,
  shouldPlayClientEvent,
  isCooldownActive,
  cooldownRemainingMs,
  markClientEventSeen,
} from "@/lib/audio/playback-math";

describe("playback math", () => {
  it("clamps layered volume product to 0..1", () => {
    expect(
      computePlaybackGain({
        soundVolume: 0.5,
        roomVolume: 0.5,
        deviceOrObsVolume: 1,
        eventVolume: 1,
      }),
    ).toBe(0.25);

    expect(
      computePlaybackGain({
        soundVolume: 2,
        roomVolume: 2,
        deviceOrObsVolume: 2,
        eventVolume: 2,
      }),
    ).toBe(1);

    expect(
      computePlaybackGain({
        soundVolume: -1,
        roomVolume: 1,
        deviceOrObsVolume: 1,
        eventVolume: 1,
      }),
    ).toBe(0);
  });

  it("rejects stale realtime events", () => {
    const now = Date.parse("2026-08-03T12:00:00.000Z");
    expect(
      isEventTooOld({
        createdAt: "2026-08-03T11:59:50.000Z",
        nowMs: now,
        maxAgeMs: 15_000,
      }),
    ).toBe(false);
    expect(
      isEventTooOld({
        createdAt: "2026-08-03T11:59:40.000Z",
        nowMs: now,
        maxAgeMs: 15_000,
      }),
    ).toBe(true);
  });

  it("dedupes by client_event_id", () => {
    const seen = new Set<string>();
    const createdAt = "2026-08-03T12:00:00.000Z";
    const nowMs = Date.parse(createdAt);
    expect(
      shouldPlayClientEvent({
        clientEventId: "a",
        seenIds: seen,
        createdAt,
        maxAgeMs: 15_000,
        nowMs,
      }),
    ).toBe(true);
    markClientEventSeen(seen, "a");
    expect(
      shouldPlayClientEvent({
        clientEventId: "a",
        seenIds: seen,
        createdAt,
        maxAgeMs: 15_000,
        nowMs,
      }),
    ).toBe(false);
  });

  it("computes cooldown remaining", () => {
    expect(
      isCooldownActive({
        lastPlayedAtMs: 1000,
        cooldownMs: 500,
        nowMs: 1200,
      }),
    ).toBe(true);
    expect(
      cooldownRemainingMs({
        lastPlayedAtMs: 1000,
        cooldownMs: 500,
        nowMs: 1200,
      }),
    ).toBe(300);
  });
});
