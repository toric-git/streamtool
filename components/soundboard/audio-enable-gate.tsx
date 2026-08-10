"use client";

import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { E, withMessage } from "@/lib/errors/catalog";

export function AudioEnableGate({
  onEnable,
  pending,
  error,
}: {
  onEnable: () => void | Promise<void>;
  pending?: boolean;
  error?: string | null;
}) {
  return (
    <div className="flex min-h-[40vh] w-full max-w-md flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-white/90 p-8 text-center">
      <p className="font-display text-2xl font-semibold tracking-tight">
        音声をオンにしよう
      </p>
      <p className="max-w-md text-sm font-semibold leading-relaxed text-muted-foreground">
        ブラウザの制限で、最初にワンタップが必要です。押したらすぐにボードが使えます。
      </p>
      {error && (
        <ErrorAlert
          error={withMessage(E.AUDIO_UNLOCK_FAILED, error)}
          className="text-left"
        />
      )}
      <Button
        type="button"
        size="lg"
        className="font-bold shadow-none"
        onClick={() => void onEnable()}
        disabled={pending}
      >
        {pending ? "有効化中…" : "タップして参加する"}
      </Button>
    </div>
  );
}
