export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Streamtool";

export const APP_TAGLINE = "VTuberのための配信ツールハブ";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export const AUDIO_LIMITS = {
  maxBytes: 10 * 1024 * 1024,
  maxDurationMs: 30_000,
  allowedMimeTypes: [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/ogg",
    "audio/webm",
  ] as const,
  allowedExtensions: ["mp3", "wav", "ogg"] as const,
} as const;

export const IMAGE_LIMITS = {
  maxBytes: 2 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  allowedExtensions: ["jpg", "jpeg", "png", "webp"] as const,
} as const;

export const REALTIME_LIMITS = {
  /** Ignore playback events older than this (client receive time vs event created_at). */
  maxEventAgeMs: 15_000,
  historyLimit: 50,
  defaultCooldownMs: 1_000,
  defaultMaxEventsPerMinute: 30,
  defaultMaxSimultaneousSounds: 4,
} as const;

export const ROOM_LIMITS = {
  defaultMaxMembers: 30,
  roomCodeLength: 8,
  displayNameMin: 1,
  displayNameMax: 30,
} as const;

export const STORAGE_BUCKETS = {
  audio: "room-audio",
  images: "room-images",
} as const;

export const SIGNED_URL_EXPIRES_IN = 60 * 10; // 10 minutes
