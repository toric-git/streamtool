import Link from "next/link";
import { SiteHeader } from "@/components/hub/site-header";
import { ToolCard } from "@/components/hub/tool-card";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_TAGLINE } from "@/lib/app-config";
import { TOOLS } from "@/lib/tools";

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
              押す・聞く・伝える。配信の手元ツールを、わかりやすくひとつに。
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild size="lg" className="font-bold shadow-none">
                <Link href="/tools/soundboard">サウンドボードを使う</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="font-bold shadow-none"
              >
                <Link href="#tools">ツールを見る</Link>
              </Button>
            </div>
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
