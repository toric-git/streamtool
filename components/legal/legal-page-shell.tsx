import type { ReactNode } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/hub/site-footer";
import { SiteHeader } from "@/components/hub/site-header";
import { Button } from "@/components/ui/button";

export function LegalPageShell({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_0%,rgba(255,77,141,0.18),transparent_45%),radial-gradient(ellipse_at_92%_18%,rgba(56,189,248,0.2),transparent_40%),linear-gradient(180deg,#fff7fb,#e8f7ff)]"
      />
      <SiteHeader compact />

      <article className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 pb-12 pt-8 md:px-10">
        <p className="text-sm font-bold text-primary">{eyebrow}</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          {title}
        </h1>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          最終更新: {updated}
        </p>

        <div className="mt-8 space-y-6 rounded-2xl border border-border/80 bg-white/90 p-6 text-sm font-semibold leading-relaxed text-foreground/85 md:p-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="outline" className="font-bold shadow-none">
            <Link href="/">TOPへ戻る</Link>
          </Button>
          <Button asChild variant="ghost" className="font-bold">
            <Link href="/developers">開発者</Link>
          </Button>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
