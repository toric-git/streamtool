import Link from "next/link";
import { SiteHeader } from "@/components/hub/site-header";
import { ToolCard } from "@/components/hub/tool-card";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_TAGLINE } from "@/lib/app-config";
import { TOOLS } from "@/lib/tools";

const FIRST_STEPS = [
  {
    step: "1",
    title: "新規登録する",
    body: "メールか Google でアカウントを作り、表示名を決めます。はじめての方はここから。",
  },
  {
    step: "2",
    title: "部屋をつくる",
    body: "ダッシュボードから部屋を作成。最初から効果音パッドが用意されています。",
  },
  {
    step: "3",
    title: "仲間を呼んで押す",
    body: "招待リンクを共有すれば、参加者みんなの端末と OBS で同じ音が鳴ります。",
  },
] as const;

export default function HomePage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col">
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_18%,rgba(255,77,141,0.35),transparent_42%),radial-gradient(ellipse_at_88%_8%,rgba(56,189,248,0.4),transparent_40%),radial-gradient(ellipse_at_70%_90%,rgba(253,224,71,0.4),transparent_45%),linear-gradient(165deg,#fff7fb_0%,#dff6ff_48%,#ffe8f2_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #ff4d8d 0 12px, transparent 13px), radial-gradient(circle at 55% 55%, #38bdf8 0 10px, transparent 11px), radial-gradient(circle at 78% 28%, #fbbf24 0 14px, transparent 15px), radial-gradient(circle at 35% 75%, #5eead4 0 11px, transparent 12px)",
            backgroundSize: "180px 180px",
          }}
        />
        <div
          aria-hidden
          className="animate-hub-pulse absolute -right-16 top-24 size-72 rounded-full bg-sky-300/40 blur-3xl"
        />

        <SiteHeader />

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 pb-24 pt-10 md:px-10 md:pb-28 md:pt-6">
          <div className="animate-hub-rise max-w-2xl space-y-5">
            <p className="font-display text-6xl font-semibold tracking-tight sm:text-7xl md:text-8xl">
              {APP_NAME}
            </p>
            <h1 className="text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl">
              {APP_TAGLINE}
            </h1>
            <p className="max-w-lg text-base font-semibold leading-relaxed text-foreground/70 sm:text-lg">
              効果音を、配信者と視聴者側の端末で同時に鳴らすツールです。
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild size="lg" className="font-bold shadow-none">
                <Link href="/login?mode=signup">無料で新規登録</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="font-bold shadow-none"
              >
                <Link href="/login">ログイン</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section
        id="start"
        className="relative border-t border-border/70 bg-white px-6 py-16 md:px-10"
      >
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            はじめての方へ
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-muted-foreground sm:text-base">
            むずかしい設定は不要です。アカウントを作って部屋を開き、ボタンを押すだけ。
            招待されただけの人も、リンクを開けば表示名を入れて参加できます。
          </p>

          <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
            {FIRST_STEPS.map((item) => (
              <li key={item.step} className="space-y-2">
                <p className="font-display text-4xl font-semibold text-[var(--hub-coral)]">
                  {item.step}
                </p>
                <h3 className="text-lg font-extrabold tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="font-bold shadow-none">
              <Link href="/login?mode=signup">新規登録してはじめる</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="font-bold shadow-none"
            >
              <Link href="/tools/soundboard">サウンドボードの説明を見る</Link>
            </Button>
          </div>
        </div>
      </section>

      <section
        id="tools"
        className="relative border-t border-border/70 bg-[#fffafc] px-6 py-16 md:px-10"
      >
        <div className="mx-auto w-full max-w-6xl">
          <h2 className="animate-hub-rise font-display text-3xl font-semibold tracking-tight md:text-4xl">
            ツール
          </h2>
          <p className="mt-2 max-w-xl text-sm font-semibold text-muted-foreground">
            まずはサウンドボード。コメント読み上げと字幕翻訳も、これからここに集まります。
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
