import type { Metadata } from "next";
import Link from "next/link";
import { AppLogo } from "@/components/brand/app-logo";
import { SiteFooter } from "@/components/hub/site-footer";
import { SiteHeader } from "@/components/hub/site-header";
import { Button } from "@/components/ui/button";
import {
  APP_NAME,
  DEVELOPER_TEAM,
  SOUND_CREDIT,
} from "@/lib/app-config";

export const metadata: Metadata = {
  title: "開発者",
  description: `${APP_NAME}は、${DEVELOPER_TEAM.description}「${DEVELOPER_TEAM.name}」が開発しています。効果音素材は${SOUND_CREDIT.name}より提供。`,
};

export default function DevelopersPage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_0%,rgba(255,77,141,0.22),transparent_45%),radial-gradient(ellipse_at_92%_18%,rgba(56,189,248,0.25),transparent_40%),linear-gradient(180deg,#fff7fb,#e8f7ff)]"
      />
      <SiteHeader compact />

      <section className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 pb-12 pt-8 md:px-10">
        <p className="text-sm font-bold text-primary">About</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          開発者
        </h1>
        <p className="mt-3 text-base font-semibold leading-relaxed text-muted-foreground">
          {APP_NAME} をつくっているチームと、効果音素材の提供元です。
        </p>

        <div className="mt-8 space-y-4">
          <article className="rounded-2xl border border-border/80 bg-white/90 p-6">
            <div
              className="mb-4 h-1.5 w-12 rounded-sm"
              style={{ backgroundColor: "var(--hub-coral)" }}
              aria-hidden
            />
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {DEVELOPER_TEAM.name}
            </h2>
            <p className="mt-2 text-sm font-bold text-primary">
              {DEVELOPER_TEAM.description}
            </p>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-muted-foreground">
              VTuber・配信者の現場目線で、コラボやOBSでも使いやすい配信ツールを開発しています。
            </p>
          </article>

          <article className="rounded-2xl border border-border/80 bg-white/90 p-6">
            <div
              className="mb-4 h-1.5 w-12 rounded-sm"
              style={{ backgroundColor: "var(--hub-sky)" }}
              aria-hidden
            />
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              効果音の提供
            </h2>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-muted-foreground">
              {SOUND_CREDIT.note}
            </p>
            <p className="mt-4 text-base font-extrabold tracking-tight">
              <a
                href={SOUND_CREDIT.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                {SOUND_CREDIT.name}
              </a>
            </p>
            <p className="mt-1 break-all text-xs font-semibold text-muted-foreground">
              {SOUND_CREDIT.url}
            </p>
          </article>

          <div className="rounded-2xl border border-dashed border-border bg-white/60 p-5">
            <AppLogo size="sm" className="mb-3" />
            <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
              ご要望や不具合は、ヘッダーの「ご要望・バグ報告」からお送りください。
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Button asChild variant="outline" className="font-bold shadow-none">
            <Link href="/">TOPへ戻る</Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
