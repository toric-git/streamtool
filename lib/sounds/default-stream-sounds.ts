import { cuteColorAt } from "@/lib/sounds/button-colors";

/**
 * Starter stream SFX pack seeded into new rooms (exactly 4 pads).
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
  color: "#FF8FB1",
} as const;

/** Order = board sort_order / pad hotkeys 1 2 3 Q */
export const DEFAULT_STREAM_SOUNDS: readonly DefaultStreamSound[] = [
  {
    file: "seikai.mp3",
    name: "正解",
    buttonColor: cuteColorAt(4).hex,
    textColor: cuteColorAt(4).text,
  },
  {
    file: "hazure.mp3",
    name: "ハズレ",
    buttonColor: cuteColorAt(11).hex,
    textColor: cuteColorAt(11).text,
  },
  {
    file: "dodon.mp3",
    name: "ドドン",
    buttonColor: cuteColorAt(0).hex,
    textColor: cuteColorAt(0).text,
  },
  {
    file: "fanfare.mp3",
    name: "ファンファーレ",
    buttonColor: cuteColorAt(3).hex,
    textColor: cuteColorAt(3).text,
  },
] as const;

/** Full preset library available from the pad "+" chooser. */
export const PRESET_LIBRARY_SOUNDS: readonly DefaultStreamSound[] =
  DEFAULT_STREAM_SOUNDS;

export function findPresetByFile(
  file: string,
): DefaultStreamSound | undefined {
  return PRESET_LIBRARY_SOUNDS.find((s) => s.file === file);
}

/** Rough CBR estimate; MP3 duration is not inspected server-side. */
export function estimateMp3DurationMs(byteLength: number): number {
  const ms = Math.round((byteLength * 8) / 128);
  return Math.min(30_000, Math.max(200, ms));
}
