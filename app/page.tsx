import type { Metadata } from "next";
import Link from "next/link";
import { AppLogo } from "@/components/brand/app-logo";
import { SiteFooter } from "@/components/hub/site-footer";
import { SiteHeader } from "@/components/hub/site-header";
import { ObsUsageGuide } from "@/components/rooms/obs-usage-guide";
import { Button } from "@/components/ui/button";
import {
  APP_NAME,
  APP_SEO_DESCRIPTION,
  APP_SEO_KEYWORDS,
  APP_SEO_TITLE,
  APP_URL,
} from "@/lib/app-config";

export const metadata: Metadata = {
  title: {
    absolute: APP_SEO_TITLE,
  },
  description: APP_SEO_DESCRIPTION,
  keywords: [...APP_SEO_KEYWORDS],
  openGraph: {
    title: APP_SEO_TITLE,
    description: APP_SEO_DESCRIPTION,
    url: APP_URL,
  },
  alternates: {
    canonical: "/",
  },
};

const FIRST_STEPS = [
  {
    step: "1",
    title: "無料で新規登録",
    body: "ブラウザだけで始められる効果音アプリです。インストール不要で、PCでもスマホでも使えます。",
  },
  {
    step: "2",
    title: "ルームを作る",
    body: "配信向けサウンドボードの部屋を作成。最初から効果音ボタンが用意されています。",
  },
  {
    step: "3",
    title: "URLで仲間を呼ぶ",
    body: "招待リンクを共有すれば、コラボ相手や配信メンバーも同じ効果音をリアルタイムで鳴らせます。",
  },
] as const;

const HIGHLIGHTS = [
  {
    title: "コラボ相手にも同じ効果音を届けるサウンドボード",
    body: "同じルームに参加すれば、コラボ相手とも効果音をリアルタイム共有。コラボ配信や参加型の演出に向いています。",
    accent: "var(--hub-coral)",
    tint: "bg-[rgba(255,77,141,0.08)]",
  },
  {
    title: "OBSへ効果音をポン出し",
    body: "ボードの音をOBSのアプリケーション音声キャプチャで取り込み、配信中にワンタップで効果音を流せます。",
    accent: "var(--hub-sky)",
    tint: "bg-[rgba(125,211,252,0.16)]",
  },
  {
    title: "好きな効果音を登録・カスタム",
    body: "MP3 / WAV などの音声ファイルをアップロードし、オリジナルの効果音ボタンを作れます。色や名前も変更可能です。",
    accent: "var(--hub-lemon)",
    tint: "bg-[rgba(253,224,71,0.18)]",
  },
] as const;

const USE_CASES = [
  {
    title: "VTuber・個人勢の配信",
    body: "雑談配信やゲーム配信で、リアクション効果音をすぐ出せるVTuber向け便利ツールです。",
    accent: "var(--hub-coral)",
  },
  {
    title: "コラボ配信",
    body: "コラボ相手にも同じ共有サウンドボードで音を鳴らしてもらえます。Discord代わりの効果音共有にも使えます。",
    accent: "var(--hub-mint)",
  },
  {
    title: "OBS配信の演出",
    body: "Stream Deckなしでも、ブラウザのサウンドボードをアプリ音声キャプチャでOBSへ乗せられます。",
    accent: "var(--hub-sky)",
  },
] as const;

const SECTION_WASH =
  "bg-[radial-gradient(ellipse_at_10%_0%,rgba(255,77,141,0.12),transparent_42%),radial-gradient(ellipse_at_90%_20%,rgba(56,189,248,0.14),transparent_40%),linear-gradient(180deg,#fff7fb_0%,#eef9ff_55%,#fff7fb_100%)]";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: APP_NAME,
  url: APP_URL,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web Browser",
  inLanguage: "ja",
  description: APP_SEO_DESCRIPTION,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "JPY",
  },
  keywords: APP_SEO_KEYWORDS.join(", "),
};

export default function HomePage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
            <AppLogo size="hero" priority className="max-w-full" />
            <p className="text-sm font-bold text-primary sm:text-base">
              VTuberによるVTuberのための配信ツール
            </p>
            <h1 className="text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl md:text-4xl">
              VTuber配信便利ツール！みんなで鳴らせる、効果音ポン出しツール
            </h1>
            <p className="max-w-xl text-base font-semibold leading-relaxed text-foreground/70 sm:text-lg">
              {APP_SEO_DESCRIPTION}
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
        id="features"
        className={`relative border-t border-border/60 px-6 py-16 md:px-10 ${SECTION_WASH}`}
      >
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-sm font-bold text-primary">できること</p>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            配信を盛り上げる共有サウンドボード
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-muted-foreground sm:text-base">
            コラボ相手にも聞こえる「効果音ポン出し」！WEBアプリなので、インストール不要で、スマホからでも操作できます。
          </p>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <li
                key={item.title}
                className={`rounded-2xl border border-border/80 ${item.tint} p-5 backdrop-blur-sm`}
              >
                <div
                  className="mb-4 h-1.5 w-12 rounded-sm"
                  style={{ backgroundColor: item.accent }}
                  aria-hidden
                />
                <h3 className="text-lg font-extrabold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="obs"
        className={`relative border-t border-border/60 px-6 py-16 md:px-10 ${SECTION_WASH}`}
      >
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-sm font-bold text-sky-600">配信連携</p>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            OBSでの使い方
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-muted-foreground sm:text-base">
            ブラウザソースや専用トークンは不要です。ボードの音をアプリケーション音声キャプチャで取り込みます。
          </p>
          <ObsUsageGuide
            context="marketing"
            showHeading={false}
            className="mt-10 space-y-4 rounded-2xl border border-border/80 bg-white/90 p-5 sm:p-6"
          />
        </div>
      </section>

      <section
        id="usecases"
        className={`relative border-t border-border/60 px-6 py-16 md:px-10 ${SECTION_WASH}`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 top-10 size-56 rounded-full bg-[rgba(255,77,141,0.12)] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 bottom-8 size-48 rounded-full bg-[rgba(56,189,248,0.16)] blur-3xl"
        />
        <div className="relative mx-auto w-full max-w-5xl">
          <p className="text-sm font-bold text-sky-600">こんなときに</p>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            VTuber・OBS・コラボ配信に
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-muted-foreground sm:text-base">
            配信中に効果音を流したい人、OBSでワンクリック再生したい人、コラボ相手と音を共有したい人向けの配信ツールです。
          </p>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {USE_CASES.map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-border/80 bg-white/85 p-5 shadow-[0_10px_30px_-18px_rgba(255,77,141,0.35)]"
              >
                <div
                  className="mb-4 h-1.5 w-12 rounded-sm"
                  style={{ backgroundColor: item.accent }}
                  aria-hidden
                />
                <h3 className="text-lg font-extrabold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="start"
        className={`relative border-t border-border/60 px-6 py-16 md:px-10 ${SECTION_WASH}`}
      >
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-sm font-bold text-primary">3ステップ</p>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            はじめての方へ
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-muted-foreground sm:text-base">
            むずかしい設定は不要です。アカウントを作って部屋を開き、ボタンを押すだけ。
            URLで参加できるルーム型サウンドボードなので、招待された人もすぐ使えます。
          </p>

          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {FIRST_STEPS.map((item) => (
              <li
                key={item.step}
                className="rounded-2xl border border-border/80 bg-white/90 p-5"
              >
                <p
                  className="inline-flex size-11 items-center justify-center rounded-2xl font-display text-2xl font-semibold text-primary-foreground"
                  style={{ backgroundColor: "var(--hub-coral)" }}
                >
                  {item.step}
                </p>
                <h3 className="mt-4 text-lg font-extrabold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">
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

      <SiteFooter />
    </main>
  );
}
