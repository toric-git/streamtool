/**
 * Curated stream SFX pack seeded into new rooms.
 * Source files live in `lib/sounds/default-assets/` (copied from public/sound).
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

/** Order = board sort_order */
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
  {
    file: "shutudai.mp3",
    name: "出題",
    buttonColor: "#2563eb",
  },
  {
    file: "drumroll.mp3",
    name: "ドラムロール",
    buttonColor: "#7c3aed",
    cooldownMs: 1500,
  },
  {
    file: "drumroll-end.mp3",
    name: "ロール締め",
    buttonColor: "#6d28d9",
  },
  {
    file: "jajaan.mp3",
    name: "ジャジャーン",
    buttonColor: "#db2777",
  },
  {
    file: "cheers.mp3",
    name: "歓声拍手",
    buttonColor: "#ea580c",
  },
  {
    file: "success.mp3",
    name: "成功",
    buttonColor: "#059669",
  },
  {
    file: "levelup.mp3",
    name: "レベルアップ",
    buttonColor: "#0d9488",
  },
  {
    file: "buzzer.mp3",
    name: "開演ブザー",
    buttonColor: "#dc2626",
  },
  {
    file: "title.mp3",
    name: "タイトル",
    buttonColor: "#4f46e5",
  },
  {
    file: "don.mp3",
    name: "ドン",
    buttonColor: "#991b1b",
  },
  {
    file: "gogogo.mp3",
    name: "ゴゴゴ",
    buttonColor: "#1e293b",
    cooldownMs: 2000,
  },
  {
    file: "chanchan.mp3",
    name: "ちゃんちゃん",
    buttonColor: "#c026d3",
  },
  {
    file: "idea.mp3",
    name: "ひらめき",
    buttonColor: "#eab308",
    textColor: "#1e293b",
  },
  {
    file: "manuke.mp3",
    name: "間抜け",
    buttonColor: "#78716c",
  },
  {
    file: "hyoshigi.mp3",
    name: "拍子木",
    buttonColor: "#a16207",
  },
  {
    file: "beep.mp3",
    name: "ピー音",
    buttonColor: "#334155",
  },
] as const;

/** Rough CBR estimate; MP3 duration is not inspected server-side. */
export function estimateMp3DurationMs(byteLength: number): number {
  const ms = Math.round((byteLength * 8) / 128);
  return Math.min(30_000, Math.max(200, ms));
}
