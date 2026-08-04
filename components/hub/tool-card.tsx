import Link from "next/link";
import type { ToolDefinition } from "@/lib/tools";

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  const available = tool.status === "available";

  const inner = (
    <>
      <div
        className="mb-4 h-1.5 w-12 rounded-sm"
        style={{ backgroundColor: tool.accent }}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl font-semibold tracking-tight">
          {tool.name}
        </h3>
        {!available && (
          <span className="shrink-0 text-xs font-bold text-muted-foreground">
            準備中
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {tool.shortDescription}
      </p>
      {available && (
        <p className="mt-4 text-sm font-bold text-primary">開く →</p>
      )}
    </>
  );

  if (!available) {
    return (
      <div className="rounded-2xl border border-border/80 bg-white/70 p-5 opacity-80">
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={tool.href}
      className="block rounded-2xl border border-border/80 bg-white/90 p-5 transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {inner}
    </Link>
  );
}
