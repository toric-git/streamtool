import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/hub/site-header";
import { Button } from "@/components/ui/button";
import { getTool } from "@/lib/tools";

export const metadata: Metadata = {
  title: "リアルタイム字幕翻訳",
  description: "リアルタイム字幕翻訳ツール（準備中）",
};

export default function SubtitleTranslateToolPage() {
  const tool = getTool("subtitle-translate");

  return (
    <main className="relative flex min-h-full flex-1 flex-col">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(251,191,36,0.28),transparent_45%),linear-gradient(180deg,#fff7fb,#fff8e7)]"
      />
      <SiteHeader compact />
      <section className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-6 py-12 md:px-10">
        <p className="text-sm font-bold text-amber-600">準備中</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
          {tool?.name}
        </h1>
        <p className="mt-4 font-semibold leading-relaxed text-muted-foreground">
          {tool?.shortDescription}
        </p>
        <Button asChild className="mt-8 font-bold shadow-none" variant="secondary">
          <Link href="/">ハブに戻る</Link>
        </Button>
      </section>
    </main>
  );
}
