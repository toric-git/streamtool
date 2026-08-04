import { describe, expect, it } from "vitest";
import { computePlaybackGain } from "@/lib/audio/playback-math";

describe("AudioEngine volume layering contract", () => {
  it("matches board formula sound*room*device*event", () => {
    expect(
      computePlaybackGain({
        soundVolume: 0.8,
        roomVolume: 0.5,
        deviceOrObsVolume: 1,
        eventVolume: 1,
      }),
    ).toBeCloseTo(0.4);
  });

  it("matches OBS formula sound*room*obs*event", () => {
    expect(
      computePlaybackGain({
        soundVolume: 1,
        roomVolume: 0.5,
        deviceOrObsVolume: 0.5,
        eventVolume: 1,
      }),
    ).toBeCloseTo(0.25);
  });
});
