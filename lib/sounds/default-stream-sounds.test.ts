import { describe, expect, it } from "vitest";
import { existsSync } from "fs";
import path from "path";
import {
  DEFAULT_STREAM_SOUNDS,
  PRESET_LIBRARY_SOUNDS,
  estimateMp3DurationMs,
} from "@/lib/sounds/default-stream-sounds";

describe("DEFAULT_STREAM_SOUNDS", () => {
  it("seeds exactly four starter sounds", () => {
    expect(DEFAULT_STREAM_SOUNDS).toHaveLength(4);
    expect(DEFAULT_STREAM_SOUNDS.map((s) => s.name)).toEqual([
      "正解",
      "ハズレ",
      "ドドン",
      "ファンファーレ",
    ]);
  });

  it("has unique names and files", () => {
    const names = DEFAULT_STREAM_SOUNDS.map((s) => s.name);
    const files = DEFAULT_STREAM_SOUNDS.map((s) => s.file);
    expect(new Set(names).size).toBe(names.length);
    expect(new Set(files).size).toBe(files.length);
  });

  it("keeps display names within schema limit", () => {
    for (const sound of DEFAULT_STREAM_SOUNDS) {
      expect(sound.name.length).toBeGreaterThanOrEqual(1);
      expect(sound.name.length).toBeLessThanOrEqual(40);
      expect(sound.buttonColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("ships matching default-assets files", () => {
    const dir = path.join(process.cwd(), "lib", "sounds", "default-assets");
    for (const sound of DEFAULT_STREAM_SOUNDS) {
      expect(existsSync(path.join(dir, sound.file))).toBe(true);
    }
  });

  it("estimates mp3 duration in allowed bounds", () => {
    expect(estimateMp3DurationMs(0)).toBe(200);
    expect(estimateMp3DurationMs(16_000)).toBeGreaterThan(200);
    expect(estimateMp3DurationMs(10_000_000)).toBe(30_000);
  });
});

describe("PRESET_LIBRARY_SOUNDS", () => {
  it("covers unique presets with on-disk assets", () => {
    expect(PRESET_LIBRARY_SOUNDS.length).toBeGreaterThanOrEqual(4);
    const names = PRESET_LIBRARY_SOUNDS.map((s) => s.name);
    const files = PRESET_LIBRARY_SOUNDS.map((s) => s.file);
    expect(new Set(names).size).toBe(names.length);
    expect(new Set(files).size).toBe(files.length);

    const dir = path.join(process.cwd(), "lib", "sounds", "default-assets");
    for (const sound of PRESET_LIBRARY_SOUNDS) {
      expect(existsSync(path.join(dir, sound.file))).toBe(true);
      expect(sound.name.length).toBeLessThanOrEqual(40);
    }
  });
});
