import Link from "next/link";
import { AppLogo } from "@/components/brand/app-logo";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { Button } from "@/components/ui/button";

export function SiteHeader({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <header
      className={`relative z-20 flex items-center justify-between gap-3 sm:gap-4 ${
        compact ? "px-4 py-3" : "px-6 py-5 md:px-10"
      }`}
    >
      <AppLogo size={compact ? "sm" : "md"} priority />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button asChild variant="ghost" size="sm" className="font-semibold">
          <Link href="/developers">開発者</Link>
        </Button>
        <FeedbackButton variant="outline" size="sm" />
        <Button asChild variant="outline" size="sm" className="font-bold">
          <Link href="/login">ログイン</Link>
        </Button>
        <Button asChild size="sm" className="font-bold shadow-none">
          <Link href="/login?mode=signup">新規登録</Link>
        </Button>
      </div>
    </header>
  );
}
