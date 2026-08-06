"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { formatErrorCodeLine } from "@/lib/errors/catalog";
import { E } from "@/lib/errors/catalog";

export function StopAllButton({
  onStopAll,
  disabled,
}: {
  onStopAll: () => Promise<void> | void;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<boolean>(false);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="destructive"
        disabled={disabled || pending}
        onClick={() => {
          if (!window.confirm("すべての再生を停止しますか？")) return;
          setError(false);
          startTransition(async () => {
            try {
              await onStopAll();
            } catch {
              setError(true);
            }
          });
        }}
      >
        {pending ? "停止中…" : "全停止"}
      </Button>
      {error && (
        <p className="text-xs text-destructive">
          {E.PLAY_STOP_ALL_FAILED.message}
          <span className="ml-1 font-mono opacity-80">
            {formatErrorCodeLine(E.PLAY_STOP_ALL_FAILED.code)}
          </span>
        </p>
      )}
    </div>
  );
}
