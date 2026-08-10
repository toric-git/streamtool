export function PageLoading({
  label = "読み込み中…",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-4 px-4 py-16">
      <div
        className="size-10 animate-spin rounded-full border-[3px] border-[var(--hub-coral)]/25 border-t-[var(--hub-coral)]"
        aria-hidden
      />
      <p className="font-display text-lg font-semibold tracking-tight">
        {label}
      </p>
      <p className="text-sm font-semibold text-muted-foreground">
        ぽんだしパッドを準備しています
      </p>
    </div>
  );
}
