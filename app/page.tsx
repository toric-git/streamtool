import Link from "next/link";
import { APP_NAME } from "@/lib/app-config";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-slate-950 text-slate-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(45,212,191,0.25),transparent_50%),radial-gradient(ellipse_at_80%_0%,rgba(56,189,248,0.2),transparent_45%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]"
      />
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <p className="text-lg font-semibold tracking-tight">{APP_NAME}</p>
        <div className="flex gap-2">
          <Button asChild variant="ghost" className="text-slate-100 hover:bg-white/10">
            <Link href="/login">ログイン</Link>
          </Button>
          <Button asChild className="bg-teal-500 text-slate-950 hover:bg-teal-400">
            <Link href="/login">はじめる</Link>
          </Button>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-6 pb-20 pt-10 md:px-10">
        <div className="max-w-2xl space-y-5">
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
            {APP_NAME}
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-slate-300">
            部屋に参加した全員と OBS
            ブラウザソースへ、同じ効果音をリアルタイム配信。配信者・視聴者・オペレーターで共有できるサウンドボードです。
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-teal-500 text-slate-950 hover:bg-teal-400">
              <Link href="/login">ログインして部屋を作成</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-slate-600 bg-transparent text-slate-100 hover:bg-white/10"
            >
              <Link href="/login">招待コードで参加へ</Link>
            </Button>
          </div>
        </div>

        <ul className="grid gap-4 text-sm text-slate-300 md:grid-cols-3">
          <li className="rounded-xl border border-white/10 bg-white/5 p-4">
            再生イベントだけを配信し、音声ファイルは各端末で再生
          </li>
          <li className="rounded-xl border border-white/10 bg-white/5 p-4">
            OBS 専用 URL・透過背景・トークン再発行に対応
          </li>
          <li className="rounded-xl border border-white/10 bg-white/5 p-4">
            権限・承認・連打制限をサーバー側でも検証
          </li>
        </ul>
      </section>
    </main>
  );
}
