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
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
        status === "connected" && "border-teal-200 bg-teal-50 text-teal-800",
        status === "connecting" && "border-amber-200 bg-amber-50 text-amber-800",
        status === "reconnecting" && "border-orange-200 bg-orange-50 text-orange-800",
        status === "disconnected" && "border-slate-200 bg-slate-50 text-slate-600",
        className,
      )}
      aria-live="polite"
    >
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full",
          status === "connected" && "bg-teal-500",
          status === "connecting" && "bg-amber-500 animate-pulse",
          status === "reconnecting" && "bg-orange-500 animate-pulse",
          status === "disconnected" && "bg-slate-400",
        )}
      />
      <span>{LABELS[status]}</span>
      <span className="sr-only">接続状態: {LABELS[status]}</span>
    </span>
  );
}
