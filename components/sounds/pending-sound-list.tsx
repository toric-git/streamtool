"use client";

import { useTransition } from "react";
import {
  approveSoundAction,
  rejectSoundAction,
  deleteSound,
} from "@/app/actions/sounds";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/types/database";

export function PendingSoundList({
  sounds,
  canModerate,
}: {
  sounds: Tables<"sounds">[];
  canModerate: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (sounds.length === 0) {
    return <p className="text-sm text-muted-foreground">承認待ちの投稿はありません。</p>;
  }

  return (
    <ul className="space-y-3">
      {sounds.map((sound) => (
        <li
          key={sound.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
        >
          <div>
            <p className="font-medium">{sound.name}</p>
            <p className="text-xs text-muted-foreground">
              {(sound.duration_ms / 1000).toFixed(1)}s · {sound.approval_status}
            </p>
          </div>
          {canModerate && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await approveSoundAction(sound.id);
                  })
                }
              >
                承認
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await rejectSoundAction(sound.id);
                  })
                }
              >
                却下
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm(`「${sound.name}」を削除しますか？`)) return;
                  startTransition(async () => {
                    await deleteSound(sound.id);
                  });
                }}
              >
                削除
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
