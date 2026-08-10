/**
 * Starter stream SFX pack seeded into new rooms (exactly 4 pads).
 * Owners can add more or delete these from サウンド管理.
 * Source files live in `lib/sounds/default-assets/`.
 */
export type DefaultStreamSound = {
  /** ASCII filename under default-assets/ */
  file: string;
  /** Board button label (max 40) */
  name: string;
  buttonColor: string;
  textColor?: string;
  cooldownMs?: number;
};

export const DEFAULT_STREAM_CATEGORY = {
  name: "配信",
  color: "#ec4899",
} as const;

/** Order = board sort_order / pad hotkeys 1 2 3 Q */
export const DEFAULT_STREAM_SOUNDS: readonly DefaultStreamSound[] = [
  {
    file: "seikai.mp3",
    name: "正解",
    buttonColor: "#16a34a",
  },
  {
    file: "hazure.mp3",
    name: "ハズレ",
    buttonColor: "#64748b",
  },
  {
    file: "dodon.mp3",
    name: "ドドン",
    buttonColor: "#b91c1c",
  },
  {
    file: "fanfare.mp3",
    name: "ファンファーレ",
    buttonColor: "#ca8a04",
  },
] as const;

/** Rough CBR estimate; MP3 duration is not inspected server-side. */
export function estimateMp3DurationMs(byteLength: number): number {
  const ms = Math.round((byteLength * 8) / 128);
  return Math.min(30_000, Math.max(200, ms));
}
