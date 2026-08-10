import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FeedbackStatusButton } from "@/components/feedback/feedback-status-button";
import { SiteHeader } from "@/components/hub/site-header";
import { Button } from "@/components/ui/button";
import { requireAppAdmin } from "@/lib/auth/app-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "フィードバック管理",
  robots: { index: false, follow: false },
};

const CATEGORY_LABEL = {
  request: "ご要望",
  bug: "バグ",
} as const;

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/admin/feedback");
  }

  const adminUser = await requireAppAdmin();
  if (!adminUser) {
    return (
      <main className="relative flex min-h-full flex-1 flex-col overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,77,141,0.12),transparent_45%),linear-gradient(180deg,#fff7fb,#e8f7ff)]"
        />
        <SiteHeader compact />
        <section className="relative z-10 mx-auto w-full max-w-lg flex-1 px-6 py-16">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            権限がありません
          </h1>
          <p className="mt-3 text-sm font-semibold text-muted-foreground">
            フィードバック管理は APP_ADMIN_EMAILS
            に登録されたアカウントのみ利用できます。
          </p>
          <Button asChild className="mt-6 font-bold shadow-none">
            <Link href="/dashboard">ダッシュボードへ</Link>
          </Button>
        </section>
      </main>
    );
  }

  const { status: statusParam } = await searchParams;
  const filter =
    statusParam === "done" ? "done" : statusParam === "all" ? "all" : "open";

  let rows: Array<{
    id: string;
    category: "request" | "bug";
    message: string;
    contact_email: string | null;
    contact_name: string | null;
    page_url: string | null;
    status: "open" | "done";
    created_at: string;
  }> = [];
  let loadError: string | null = null;

  try {
    const admin = createAdminClient();
    let query = admin
      .from("feedback_reports")
      .select(
        "id, category, message, contact_email, contact_name, page_url, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (error) {
      loadError = error.message;
    } else {
      rows = (data ?? []) as typeof rows;
    }
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "読み込みに失敗しました";
  }

  return (
    <main className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,77,141,0.12),transparent_45%),linear-gradient(180deg,#fff7fb,#e8f7ff)]"
      />
      <SiteHeader compact />

      <section className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-6 pb-16 pt-8 md:px-10">
        <p className="text-sm font-bold text-primary">Admin</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          フィードバック管理
        </h1>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          {adminUser.email}{" "}
          として表示中。未対応の確認と対応済みへの更新ができます。
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            asChild
            size="sm"
            variant={filter === "open" ? "default" : "outline"}
            className="font-bold shadow-none"
          >
            <Link href="/admin/feedback">未対応</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={filter === "done" ? "default" : "outline"}
            className="font-bold shadow-none"
          >
            <Link href="/admin/feedback?status=done">対応済み</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            className="font-bold shadow-none"
          >
            <Link href="/admin/feedback?status=all">すべて</Link>
          </Button>
        </div>

        {loadError && (
          <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive">
            読み込みエラー: {loadError}
            （migration `20260810180000_feedback_ops_rate_limit.sql` の適用と
            SUPABASE_SERVICE_ROLE_KEY を確認してください）
          </p>
        )}

        {!loadError && rows.length === 0 && (
          <p className="mt-8 text-sm font-semibold text-muted-foreground">
            該当するフィードバックはありません。
          </p>
        )}

        <ul className="mt-6 space-y-4">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-2xl border border-border/80 bg-white/90 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-primary">
                    {CATEGORY_LABEL[row.category]} ·{" "}
                    {row.status === "open" ? "未対応" : "対応済み"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">
                    {new Date(row.created_at).toLocaleString("ja-JP")}
                    {row.page_url ? ` · ${row.page_url}` : ""}
                  </p>
                </div>
                <FeedbackStatusButton id={row.id} status={row.status} />
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-relaxed">
                {row.message}
              </p>
              {(row.contact_name || row.contact_email) && (
                <p className="mt-3 text-xs font-semibold text-muted-foreground">
                  連絡先: {row.contact_name || "—"}
                  {row.contact_email ? ` / ${row.contact_email}` : ""}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
