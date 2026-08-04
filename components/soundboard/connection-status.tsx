"use client";

import type { ConnectionStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const LABELS: Record<ConnectionStatus, string> = {
  connecting: "接続中",
  connected: "接続済み",
  reconnecting: "再接続中",
  disconnected: "切断",
};

export function ConnectionStatusBadge({
  status,
  className,
}: {
  status: ConnectionStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-2.5 py-1 text-xs font-bold",
        status === "connected" && "border-sky-200 bg-sky-50 text-sky-800",
        status === "connecting" && "border-amber-200 bg-amber-50 text-amber-800",
        status === "reconnecting" && "border-orange-200 bg-orange-50 text-orange-800",
        status === "disconnected" && "border-border bg-muted text-muted-foreground",
        className,
      )}
      aria-live="polite"
    >
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full",
          status === "connected" && "bg-sky-500",
          status === "connecting" && "animate-pulse bg-amber-500",
          status === "reconnecting" && "animate-pulse bg-orange-500",
          status === "disconnected" && "bg-muted-foreground",
        )}
      />
      <span>{LABELS[status]}</span>
      <span className="sr-only">接続状態: {LABELS[status]}</span>
    </span>
  );
}
