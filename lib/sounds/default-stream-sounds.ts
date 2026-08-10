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
    buttonColor: "#5eead4", // mint
    textColor: "#0f766e",
  },
  {
    file: "hazure.mp3",
    name: "ハズレ",
    buttonColor: "#fda4af", // soft rose
    textColor: "#9f1239",
  },
  {
    file: "dodon.mp3",
    name: "ドドン",
    buttonColor: "#ff6b9d", // candy coral
    textColor: "#ffffff",
  },
  {
    file: "fanfare.mp3",
    name: "ファンファーレ",
    buttonColor: "#fbbf24", // lemon gold
    textColor: "#92400e",
  },
] as const;

/** Rough CBR estimate; MP3 duration is not inspected server-side. */
export function estimateMp3DurationMs(byteLength: number): number {
  const ms = Math.round((byteLength * 8) / 128);
  return Math.min(30_000, Math.max(200, ms));
}
