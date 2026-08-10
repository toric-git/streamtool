import Link from "next/link";
import {
  APP_NAME,
  DEVELOPER_TEAM,
  SOUND_CREDIT,
} from "@/lib/app-config";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border/60 bg-white/50 px-6 py-8 md:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-muted-foreground">
          {APP_NAME} · {DEVELOPER_TEAM.name}
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold">
          <Link
            href="/developers"
            className="text-foreground/80 transition hover:text-primary"
          >
            開発者
          </Link>
          <Link
            href="/terms"
            className="text-foreground/80 transition hover:text-primary"
          >
            利用規約
          </Link>
          <Link
            href="/privacy"
            className="text-foreground/80 transition hover:text-primary"
          >
            プライバシー
          </Link>
          <a
            href={SOUND_CREDIT.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/80 transition hover:text-primary"
          >
            効果音ラボ
          </a>
        </nav>
      </div>
    </footer>
  );
}
