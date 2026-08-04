import { describe, expect, it } from "vitest";
import {
  validateAudioFileMeta,
  validateImageFileMeta,
  displayNameSchema,
} from "@/lib/validation/schemas";

describe("file validation", () => {
  it("accepts valid audio meta", () => {
    expect(
      validateAudioFileMeta({
        filename: "cheer.mp3",
        mimeType: "audio/mpeg",
        sizeBytes: 1024,
        durationMs: 2500,
      }),
    ).toEqual({ ok: true });
  });

  it("rejects oversized or long audio", () => {
    expect(
      validateAudioFileMeta({
        filename: "big.wav",
        mimeType: "audio/wav",
        sizeBytes: 11 * 1024 * 1024,
        durationMs: 1000,
      }).ok,
    ).toBe(false);
    expect(
      validateAudioFileMeta({
        filename: "long.ogg",
        mimeType: "audio/ogg",
        sizeBytes: 1000,
        durationMs: 31_000,
      }).ok,
    ).toBe(false);
  });

  it("validates images", () => {
    expect(
      validateImageFileMeta({
        filename: "btn.png",
        mimeType: "image/png",
        sizeBytes: 1000,
      }),
    ).toEqual({ ok: true });
    expect(
      validateImageFileMeta({
        filename: "btn.gif",
        mimeType: "image/gif",
        sizeBytes: 1000,
      }).ok,
    ).toBe(false);
  });

  it("sanitizes display names", () => {
    expect(displayNameSchema.parse("  Alice  ")).toBe("Alice");
    expect(() => displayNameSchema.parse("")).toThrow();
  });
});
