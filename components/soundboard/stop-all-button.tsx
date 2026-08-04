"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function StopAllButton({
  onStopAll,
  disabled,
}: {
  onStopAll: () => Promise<void> | void;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="destructive"
        disabled={disabled || pending}
        onClick={() => {
          if (!window.confirm("すべての再生を停止しますか？")) return;
          setError(null);
          startTransition(async () => {
            try {
              await onStopAll();
            } catch {
              setError("全停止に失敗しました。");
            }
          });
        }}
      >
        {pending ? "停止中…" : "全停止"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
