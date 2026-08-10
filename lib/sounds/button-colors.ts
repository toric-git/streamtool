/** Soft pastel pad colors for stream sound buttons. */
export type CuteButtonColor = {
  hex: string;
  label: string;
  text: string;
};

export const CUTE_BUTTON_COLORS: readonly CuteButtonColor[] = [
  { hex: "#FF8FB1", label: "いちごミルク", text: "#ffffff" },
  { hex: "#FFB4A2", label: "ピーチ", text: "#7c2d12" },
  { hex: "#FFD6A5", label: "みかん", text: "#9a3412" },
  { hex: "#FFE66D", label: "レモン", text: "#854d0e" },
  { hex: "#B8F2E6", label: "ミント", text: "#0f766e" },
  { hex: "#A0E7E5", label: "ソーダ", text: "#0e7490" },
  { hex: "#9BF6FF", label: "スカイ", text: "#075985" },
  { hex: "#A0C4FF", label: "くも", text: "#1e3a8a" },
  { hex: "#BDB2FF", label: "ラベンダー", text: "#4c1d95" },
  { hex: "#FFC6FF", label: "わたあめ", text: "#9d174d" },
  { hex: "#F7AEF8", label: "あじさい", text: "#6b21a8" },
  { hex: "#FFCAD4", label: "さくら", text: "#9f1239" },
] as const;

export const DEFAULT_BUTTON_COLOR = CUTE_BUTTON_COLORS[0].hex;
export const DEFAULT_BUTTON_TEXT_COLOR = CUTE_BUTTON_COLORS[0].text;

export function cuteColorAt(index: number): CuteButtonColor {
  return CUTE_BUTTON_COLORS[index % CUTE_BUTTON_COLORS.length]!;
}

export function findCuteColor(hex: string): CuteButtonColor | undefined {
  const normalized = hex.trim().toLowerCase();
  return CUTE_BUTTON_COLORS.find((c) => c.hex.toLowerCase() === normalized);
}
