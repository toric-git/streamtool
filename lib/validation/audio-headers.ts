import { AUDIO_LIMITS } from "@/lib/app-config";

export type AudioFormat = "mp3" | "wav" | "ogg";

export type AudioHeaderResult =
  | {
      ok: true;
      format: AudioFormat;
      /** Estimated duration when reliably computable (WAV). Otherwise null. */
      durationMs: number | null;
    }
  | { ok: false; message: string };

function readU32LE(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

function startsWith(bytes: Uint8Array, ascii: string, offset = 0): boolean {
  if (bytes.length < offset + ascii.length) return false;
  for (let i = 0; i < ascii.length; i += 1) {
    if (bytes[offset + i] !== ascii.charCodeAt(i)) return false;
  }
  return true;
}

function detectMp3(bytes: Uint8Array): boolean {
  // ID3v2
  if (startsWith(bytes, "ID3")) return true;
  // Frame sync 0xFFEx
  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0) {
    return true;
  }
  return false;
}

function parseWavDurationMs(bytes: Uint8Array): number | null {
  if (bytes.length < 44) return null;
  if (!startsWith(bytes, "RIFF") || !startsWith(bytes, "WAVE", 8)) return null;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 12;
  let byteRate = 0;
  let dataSize = 0;

  while (offset + 8 <= bytes.length) {
    const chunkId = String.fromCharCode(
      bytes[offset]!,
      bytes[offset + 1]!,
      bytes[offset + 2]!,
      bytes[offset + 3]!,
    );
    const chunkSize = readU32LE(view, offset + 4);
    const dataOffset = offset + 8;

    if (chunkId === "fmt " && dataOffset + 16 <= bytes.length) {
      byteRate = readU32LE(view, dataOffset + 8);
    } else if (chunkId === "data") {
      dataSize = chunkSize;
      break;
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  if (byteRate <= 0 || dataSize <= 0) return null;
  return Math.round((dataSize / byteRate) * 1000);
}

/**
 * Validate audio magic bytes and optionally estimate duration (WAV).
 * Does not fully decode MP3/OGG duration (documented limitation).
 */
export function inspectAudioHeader(
  input: ArrayBuffer | Uint8Array,
): AudioHeaderResult {
  const bytes =
    input instanceof Uint8Array ? input : new Uint8Array(input);

  if (bytes.length < 12) {
    return { ok: false, message: "音声ファイルが短すぎるか破損しています。" };
  }

  if (startsWith(bytes, "RIFF") && startsWith(bytes, "WAVE", 8)) {
    const durationMs = parseWavDurationMs(bytes);
    if (durationMs != null) {
      if (durationMs <= 0 || durationMs > AUDIO_LIMITS.maxDurationMs) {
        return {
          ok: false,
          message: `再生時間は ${AUDIO_LIMITS.maxDurationMs / 1000} 秒以下にしてください`,
        };
      }
    }
    return { ok: true, format: "wav", durationMs };
  }

  if (startsWith(bytes, "OggS")) {
    return { ok: true, format: "ogg", durationMs: null };
  }

  if (detectMp3(bytes)) {
    return { ok: true, format: "mp3", durationMs: null };
  }

  return {
    ok: false,
    message: "対応形式（MP3 / WAV / OGG）の音声ファイルではありません。",
  };
}

export function extensionMatchesFormat(
  extension: string,
  format: AudioFormat,
): boolean {
  const ext = extension.toLowerCase();
  if (format === "mp3") return ext === "mp3";
  if (format === "wav") return ext === "wav";
  if (format === "ogg") return ext === "ogg";
  return false;
}

export function inspectImageHeader(
  input: ArrayBuffer | Uint8Array,
): { ok: true; format: "jpeg" | "png" | "webp" } | { ok: false; message: string } {
  const bytes =
    input instanceof Uint8Array ? input : new Uint8Array(input);

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ok: true, format: "jpeg" };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    startsWith(bytes, "PNG", 1)
  ) {
    return { ok: true, format: "png" };
  }
  if (bytes.length >= 12 && startsWith(bytes, "RIFF") && startsWith(bytes, "WEBP", 8)) {
    return { ok: true, format: "webp" };
  }
  return { ok: false, message: "対応形式（JPEG / PNG / WebP）の画像ではありません。" };
}
