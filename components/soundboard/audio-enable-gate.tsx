"use client";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { APP_NAME } from "@/lib/app-config";

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
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-card/60 p-8 text-center">
      <p className="text-lg font-semibold">{APP_NAME}</p>
      <p className="max-w-md text-sm text-muted-foreground">
        この部屋では効果音が再生されます。「参加して音声を有効にする」を押してください。
      </p>
      {error && <Alert variant="destructive">{error}</Alert>}
      <Button type="button" size="lg" onClick={() => void onEnable()} disabled={pending}>
        {pending ? "有効化中…" : "参加して音声を有効にする"}
      </Button>
    </div>
  );
}
