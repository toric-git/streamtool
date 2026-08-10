"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { installDefaultStreamSounds } from "@/app/actions/sounds";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import type { AppError } from "@/lib/errors/catalog";
import { DEFAULT_STREAM_SOUNDS } from "@/lib/sounds/default-stream-sounds";

export function InstallDefaultSoundsButton({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<AppError | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-white/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-semibold">配信サンプル音</h2>
          <p className="text-sm text-muted-foreground">
            正解・ハズレ・ドドン・ファンファーレなど、配信でよく使う{" "}
            {DEFAULT_STREAM_SOUNDS.length}{" "}
            音をまとめて追加します。同名の音がある場合はスキップされます。
          </p>
        </div>
        <Button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            setMessage(null);
            startTransition(async () => {
              const result = await installDefaultStreamSounds(roomId);
              if (!result.ok) {
                setError({ code: result.code, message: result.error });
                return;
              }
              setMessage(
                `${result.data?.seeded ?? 0} 件追加しました` +
                  (result.data?.skipped
                    ? `（${result.data.skipped} 件スキップ）`
                    : ""),
              );
              router.refresh();
            });
          }}
        >
          {pending ? "追加中…" : "サンプル音を追加"}
        </Button>
      </div>
      {error && <ErrorAlert error={error} />}
      {message && (
        <p className="text-sm font-semibold text-emerald-700">{message}</p>
      )}
      {!error && !message && (
        <p className="text-xs text-muted-foreground">
          新規部屋では作成時に自動で入ります。既存部屋向けの手動追加です。
        </p>
      )}
    </div>
  );
}
