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
      <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
        {events.length === 0 ? (
          <li className="text-muted-foreground">まだ再生がありません</li>
        ) : (
          events.map((e) => {
            const soundName =
              e.soundId && soundNames?.[e.soundId]
                ? soundNames[e.soundId]
                : e.soundId
                  ? "不明なサウンド"
                  : null;
            return (
              <li key={e.id} className="rounded-md border px-2 py-1.5">
                <p className="font-medium">
                  {ACTION_LABEL[e.action]}
                  {soundName ? ` · ${soundName}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {e.userDisplayName} ·{" "}
                  {new Date(e.createdAt).toLocaleTimeString("ja-JP")}
                </p>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
