import Link from "next/link";
import { APP_NAME } from "@/lib/app-config";
import { Button } from "@/components/ui/button";

export function SiteHeader({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <header
      className={`relative z-20 flex items-center justify-between gap-4 ${
        compact ? "px-4 py-3" : "px-6 py-5 md:px-10"
      }`}
    >
      <Link
        href="/"
        className="font-display text-xl font-semibold tracking-tight text-foreground transition hover:text-primary md:text-2xl"
      >
        {APP_NAME}
      </Link>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" className="font-semibold">
          <Link href="/login">ログイン</Link>
        </Button>
        <Button asChild variant="secondary" className="font-semibold shadow-none">
          <Link href="/login?mode=signup">サインイン</Link>
        </Button>
        <Button asChild className="font-semibold shadow-none">
          <Link href="/tools/soundboard">はじめる</Link>
        </Button>
      </div>
    </header>
  );
}
