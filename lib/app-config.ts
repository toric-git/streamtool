export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME?.trim() || "みんなの効果音";

/** Short product line used in UI chrome (not the SEO title). */
export const APP_TAGLINE =
  "VTuber・コラボ配信向けの共有サウンドボード";

/** Canonical SEO title for the marketing homepage. */
export const APP_SEO_TITLE =
  "みんなの効果音｜VTuber・コラボ配信向け共有サウンドボード";

/** Canonical meta description for the marketing homepage. */
export const APP_SEO_DESCRIPTION =
  "「みんなの効果音」は、配信コラボメンバーが同じルームに参加し、リアルタイムで効果音を鳴らせる共有サウンドボードです。OBS配信への音声出力、オリジナル音源のアップロード、効果音ボタンのカスタマイズに対応します。リスナー参加型でも楽しく使えます。";

/** Primary search phrases to reinforce on the homepage (not for stuffing). */
export const APP_SEO_KEYWORDS = [
  "効果音アプリ",
  "効果音ポン出し",
  "ポン出しアプリ",
  "サウンドボード",
  "配信 効果音",
  "OBS 効果音",
  "VTuber 効果音",
  "サウンドボード 共有",
  "複数人 効果音",
  "ブラウザ サウンドボード",
  "VTuber 配信ツール",
  "VTuber 便利ツール",
  "コラボ配信 ツール",
  "共有サウンドボード",
  "配信を盛り上げるツール",
] as const;

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

/** Product development team credit. */
export const DEVELOPER_TEAM = {
  name: "VtuberPlus",
  description:
    "VTuberによるVTuberのための配信ツール開発チーム",
} as const;

/** Default SFX library credit shown on the developers page. */
export const SOUND_CREDIT = {
  name: "効果音ラボ",
  url: "https://soundeffect-lab.info/",
  note: "効果音ラボ様から、効果音をお借りしております。",
} as const;

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
  /** Minimum per-pad cooldown (anti mash). */
  minCooldownMs: 1_000,
  defaultCooldownMs: 1_500,
  /** Minimum gap between any pad presses on this client. */
  minPadGapMs: 400,
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
