import { describe, expect, it } from "vitest";
import { E } from "@/lib/errors/catalog";

describe("error catalog", () => {
  it("assigns unique error codes", () => {
    const codes = Object.values(E).map((err) => err.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("includes codes for display-name onboarding and recent features", () => {
    expect(E.AUTH_DISPLAY_NAME_REQUIRED.code).toBe("E1013");
    expect(E.PROFILE_NAME_UPDATE_FAILED.code).toBe("E1014");
    expect(E.ROOM_CREATE_SEED_FAILED.code).toBe("E2105");
    expect(E.SOUND_SEED_FORBIDDEN.code).toBe("E4025");
    expect(E.SOUND_SEED_FAILED.code).toBe("E4026");
    expect(E.SOUND_SEED_NONE.code).toBe("E4027");
    expect(E.SOUND_SEED_ASSET_MISSING.code).toBe("E4028");
    expect(E.SOUND_SEED_UPLOAD_FAILED.code).toBe("E4029");
    expect(E.SOUND_SEED_INSERT_FAILED.code).toBe("E4030");
    expect(E.SOUND_SEED_PARTIAL.code).toBe("E4031");
    expect(E.AUDIO_UNLOCK_FAILED.code).toBe("E5008");
    expect(E.AUDIO_ENGINE_NOT_READY.code).toBe("E5009");
    expect(E.AUDIO_PLAYBACK_FAILED.code).toBe("E5010");
    expect(E.AUDIO_LOCKED.code).toBe("E5011");
  });
});
