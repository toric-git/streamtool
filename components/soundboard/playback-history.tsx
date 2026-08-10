"use client";

import type { PlaybackEventPayload } from "@/types/database";

const ACTION_LABEL: Record<PlaybackEventPayload["action"], string> = {
  play: "再生",
  stop: "停止",
  stop_all: "全停止",
};

export function PlaybackHistory({
  events,
  soundNames,
}: {
  events: PlaybackEventPayload[];
  soundNames?: Record<string, string>;
}) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="text-sm font-semibold">再生履歴</h2>
      <ul className="mt-2 max-h-64 overflow-y-auto text-sm">
        {events.length === 0 ? (
          <li className="py-1 text-muted-foreground">まだ再生がありません</li>
        ) : (
          events.map((e) => {
            const soundName =
              e.soundId && soundNames?.[e.soundId]
                ? soundNames[e.soundId]
                : e.soundId
                  ? "不明なサウンド"
                  : null;
            const time = new Date(e.createdAt).toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
            return (
              <li
                key={e.id}
                className="flex items-center gap-2 truncate border-b border-border/50 py-1.5 last:border-b-0"
              >
                <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                  {time}
                </span>
                <span className="min-w-0 truncate">
                  <span className="font-medium">{ACTION_LABEL[e.action]}</span>
                  {soundName ? (
                    <span className="text-muted-foreground"> · {soundName}</span>
                  ) : null}
                  <span className="text-muted-foreground">
                    {" "}
                    · {e.userDisplayName}
                  </span>
                </span>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
