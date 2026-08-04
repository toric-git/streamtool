import { describe, expect, it } from "vitest";
import {
  extensionMatchesFormat,
  inspectAudioHeader,
  inspectImageHeader,
} from "@/lib/validation/audio-headers";

function ascii(text: string): Uint8Array {
  return Uint8Array.from(text, (c) => c.charCodeAt(0));
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function u32le(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n, true);
  return b;
}

function u16le(n: number): Uint8Array {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n, true);
  return b;
}

describe("inspectAudioHeader", () => {
  it("accepts WAV and estimates duration", () => {
    // Minimal WAV: 1s mono 8-bit 8000Hz => data size 8000, byteRate 8000
    const fmt = concat(
      ascii("fmt "),
      u32le(16),
      u16le(1), // PCM
      u16le(1), // channels
      u32le(8000), // sample rate
      u32le(8000), // byte rate
      u16le(1), // block align
      u16le(8), // bits
    );
    const data = concat(ascii("data"), u32le(8000), new Uint8Array(8000));
    const riffSize = 4 + fmt.length + data.length;
    const wav = concat(ascii("RIFF"), u32le(riffSize), ascii("WAVE"), fmt, data);

    const result = inspectAudioHeader(wav);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.format).toBe("wav");
      expect(result.durationMs).toBe(1000);
    }
  });

  it("accepts OGG and MP3 signatures", () => {
    expect(inspectAudioHeader(ascii("OggS........")).ok).toBe(true);
    expect(inspectAudioHeader(ascii("ID3.........")).ok).toBe(true);
    const mp3Frame = new Uint8Array([0xff, 0xfb, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    expect(inspectAudioHeader(mp3Frame).ok).toBe(true);
  });

  it("rejects unknown bytes", () => {
    const result = inspectAudioHeader(ascii("NOTAUDIOFILE"));
    expect(result.ok).toBe(false);
  });
});

describe("inspectImageHeader", () => {
  it("detects jpeg/png/webp", () => {
    expect(inspectImageHeader(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])).ok).toBe(true);
    expect(
      inspectImageHeader(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])).ok,
    ).toBe(true);
    expect(
      inspectImageHeader(concat(ascii("RIFF"), u32le(0), ascii("WEBP"))).ok,
    ).toBe(true);
  });
});

describe("extensionMatchesFormat", () => {
  it("matches extensions", () => {
    expect(extensionMatchesFormat("mp3", "mp3")).toBe(true);
    expect(extensionMatchesFormat("wav", "ogg")).toBe(false);
  });
});
