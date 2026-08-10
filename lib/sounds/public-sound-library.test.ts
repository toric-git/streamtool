import { existsSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  displayNameFromSoundFile,
  isSafePublicSoundFileName,
  listPublicLibrarySounds,
  PUBLIC_SOUND_DIR,
  publicSoundAbsolutePath,
} from "@/lib/sounds/public-sound-library";

describe("public-sound-library", () => {
  it("lists mp3 files under public/sound", () => {
    expect(existsSync(PUBLIC_SOUND_DIR)).toBe(true);
    const sounds = listPublicLibrarySounds();
    expect(sounds.length).toBeGreaterThan(0);
    for (const sound of sounds) {
      expect(sound.file.endsWith(".mp3")).toBe(true);
      expect(sound.name.length).toBeGreaterThan(0);
      expect(sound.name.length).toBeLessThanOrEqual(40);
      expect(sound.publicUrl).toBe(`/sound/${encodeURIComponent(sound.file)}`);
      expect(existsSync(publicSoundAbsolutePath(sound.file)!)).toBe(true);
    }
  });

  it("rejects path traversal", () => {
    expect(isSafePublicSoundFileName("../etc/passwd.mp3")).toBe(false);
    expect(isSafePublicSoundFileName("a/b.mp3")).toBe(false);
    expect(isSafePublicSoundFileName("ok.mp3")).toBe(true);
    expect(publicSoundAbsolutePath("../x.mp3")).toBeNull();
  });

  it("derives display names from filenames", () => {
    expect(displayNameFromSoundFile("ファンファーレ.mp3")).toBe("ファンファーレ");
    expect(displayNameFromSoundFile(path.basename("チーン (1).mp3"))).toBe(
      "チーン (1)",
    );
  });
});
