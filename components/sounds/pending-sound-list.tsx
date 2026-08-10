"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approveSoundAction,
  deleteSound,
  rejectSoundAction,
} from "@/app/actions/sounds";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import type { ActionResult } from "@/lib/actions/result";
import type { AppError } from "@/lib/errors/catalog";
import type { Tables } from "@/types/database";

export type PendingSound = Pick<
  Tables<"sounds">,
  "id" | "name" | "duration_ms" | "approval_status"
>;

export function PendingSoundList({
  sounds,
  canModerate,
}: {
  sounds: PendingSound[];
  canModerate: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<AppError | null>(null);
  const [pending, startTransition] = useTransition();

  if (sounds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        承認待ちの投稿はありません。
      </p>
    );
  }

  function refreshOnSuccess(result: ActionResult) {
    if (!result.ok) {
      setError({ code: result.code, message: result.error });
      return;
    }
    setError(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <ErrorAlert error={error} />}
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
                      const result = await approveSoundAction(sound.id);
                      refreshOnSuccess(result);
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
                      const result = await rejectSoundAction(sound.id);
                      refreshOnSuccess(result);
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
                      const result = await deleteSound(sound.id);
                      refreshOnSuccess(result);
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
    </div>
  );
}
