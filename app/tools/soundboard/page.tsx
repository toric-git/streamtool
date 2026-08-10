import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/hub/site-header";
import { Button } from "@/components/ui/button";
import { getTool } from "@/lib/tools";

export const metadata: Metadata = {
  title: "効果音ポン出し・共有サウンドボード",
  description:
    "VTuber・コラボ配信向け。部屋の全員とOBSで同じ効果音をリアルタイム再生できる、ブラウザの共有サウンドボードです。",
};

export default function SoundboardToolPage() {
  const tool = getTool("soundboard");

  return (
    <main className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(255,77,141,0.22),transparent_45%),radial-gradient(ellipse_at_100%_30%,rgba(56,189,248,0.25),transparent_40%),linear-gradient(180deg,#fff7fb,#e8f7ff)]"
      />
      <SiteHeader compact />

      <section className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 pb-16 pt-8 md:px-10">
        <p className="text-sm font-bold text-primary">ツール</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          {tool?.name ?? "リアルタイムサウンドボード"}
        </h1>
        <p className="mt-4 text-lg font-semibold leading-relaxed text-muted-foreground">
          いちばん大事なのは「迷わず押せる」こと。大きなボタン、わかりやすい接続状態、招待コードだけで仲間と共有できます。
        </p>

        <ul className="mt-8 space-y-3 text-sm font-semibold text-foreground/80">
          <li className="rounded-2xl border border-border bg-white/80 px-4 py-3">
            大きいボタンで、配信中でも押しやすい
          </li>
          <li className="rounded-2xl border border-border bg-white/80 px-4 py-3">
            部屋のメンバーと OBS に同時再生
          </li>
          <li className="rounded-2xl border border-border bg-white/80 px-4 py-3">
            招待リンクでゲストもすぐ参加
          </li>
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="font-bold shadow-none">
            <Link href="/login?next=/dashboard">ログインして始める</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="font-bold shadow-none"
          >
            <Link href="/login?next=/dashboard">招待コードで参加</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
