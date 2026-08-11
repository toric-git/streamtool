export type ToolStatus = "available" | "coming_soon";

export type ToolDefinition = {
  id: string;
  name: string;
  shortDescription: string;
  href: string;
  status: ToolStatus;
  accent: string;
};

export const TOOLS: ToolDefinition[] = [
  {
    id: "soundboard",
    name: "リアルタイムサウンドボード",
    shortDescription:
      "部屋の全員で同じ効果音を同時再生。OBSはアプリ音声キャプチャで取り込み。",
    href: "/tools/soundboard",
    status: "available",
    accent: "#ff4d8d",
  },
  {
    id: "comment-reader",
    name: "コメント読み上げ",
    shortDescription:
      "配信コメントを声で読み上げ。見逃しを減らすリスナー向けオペレーション。",
    href: "/tools/comment-reader",
    status: "coming_soon",
    accent: "#22d3ee",
  },
  {
    id: "subtitle-translate",
    name: "リアルタイム字幕翻訳",
    shortDescription:
      "発話やチャットをその場で字幕化・翻訳。海外リスナーにも届けやすく。",
    href: "/tools/subtitle-translate",
    status: "coming_soon",
    accent: "#fbbf24",
  },
];

export function getTool(id: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.id === id);
}
