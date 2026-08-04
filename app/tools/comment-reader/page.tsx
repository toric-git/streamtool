import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/hub/site-header";
import { Button } from "@/components/ui/button";
import { getTool } from "@/lib/tools";

export const metadata: Metadata = {
  title: "コメント読み上げ",
  description: "配信コメントの読み上げツール（準備中）",
};

export default function CommentReaderToolPage() {
  const tool = getTool("comment-reader");

  return (
    <main className="relative flex min-h-full flex-1 flex-col">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(34,211,238,0.25),transparent_45%),linear-gradient(180deg,#fff7fb,#e8f7ff)]"
      />
      <SiteHeader compact />
      <section className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-6 py-12 md:px-10">
        <p className="text-sm font-bold text-sky-600">準備中</p>
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
