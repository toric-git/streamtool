"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteSound } from "@/app/actions/sounds";
import { InstallDefaultSoundsButton } from "@/components/sounds/install-default-sounds-button";
import { SoundUploadForm } from "@/components/sounds/sound-upload-form";
import type { BoardSound } from "@/components/soundboard/sound-grid";
import { VolumeSlider } from "@/components/soundboard/volume-slider";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import type { AppError } from "@/lib/errors/catalog";

type Category = { id: string; name: string };

/**
 * Board-local sound add/delete/volume. Keeps day-to-day ops on the board.
 */
export function BoardSoundsPanel({
  roomId,
  sounds,
  categories,
  canUpload,
  canDelete,
  canEditVolume,
  canInstallDefaults,
  onVolumeChange,
  onVolumeCommit,
}: {
  roomId: string;
  sounds: BoardSound[];
  categories: Category[];
  canUpload: boolean;
  canDelete: boolean;
  canEditVolume: boolean;
  canInstallDefaults: boolean;
  onVolumeChange?: (soundId: string, volume: number) => void;
  onVolumeCommit?: (soundId: string, volume: number) => void;
}) {
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canUpload && !canDelete && !canInstallDefaults && !canEditVolume) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border/80 bg-white/90 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            サウンドの追加・削除・音量
          </h2>
          <p className="text-xs font-semibold text-muted-foreground">
            個別音量は全員の再生に反映されます。上部バーは自分の端末音量です。
          </p>
        </div>
        {canUpload && (
          <Button
            type="button"
            size="sm"
            variant={showUpload ? "secondary" : "default"}
            onClick={() => setShowUpload((v) => !v)}
          >
            {showUpload ? "追加フォームを閉じる" : "＋ サウンドを追加"}
          </Button>
        )}
      </div>

      {error && <ErrorAlert error={error} />}

      {canInstallDefaults && sounds.length === 0 && (
        <InstallDefaultSoundsButton roomId={roomId} />
      )}

      {showUpload && canUpload && (
        <SoundUploadForm
          roomId={roomId}
          categories={categories}
          canUpload={canUpload}
          compact
          onSuccess={() => {
            setShowUpload(false);
            router.refresh();
          }}
        />
      )}

      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground">
          登録中 {sounds.length} 件
        </p>
        {sounds.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
            まだありません。上の「初期4音を追加」か「サウンドを追加」を使ってください。
          </p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {sounds.map((sound) => (
              <li key={sound.id} className="space-y-2 px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <span
                    className="size-3 shrink-0 rounded-full border border-white/70 shadow-sm"
                    style={{ backgroundColor: sound.button_color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">
                    {sound.name}
                  </span>
                  {canDelete && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={pending && pendingId === sound.id}
                      onClick={() => {
                        if (
                          !window.confirm(
                            `「${sound.name}」を削除しますか？\nパッドから消えて元に戻せません。`,
                          )
                        ) {
                          return;
                        }
                        setError(null);
                        setPendingId(sound.id);
                        startTransition(async () => {
                          const result = await deleteSound(sound.id);
                          setPendingId(null);
                          if (!result.ok) {
                            setError({
                              code: result.code,
                              message: result.error,
                            });
                            return;
                          }
                          router.refresh();
                        });
                      }}
                    >
                      削除
                    </Button>
                  )}
                </div>
                {canEditVolume && onVolumeChange && (
                  <VolumeSlider
                    id={`list-vol-${sound.id}`}
                    label="個別音量"
                    size="sm"
                    value={Number(sound.volume)}
                    onChange={(v) => onVolumeChange(sound.id, v)}
                    onCommit={(v) => onVolumeCommit?.(sound.id, v)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {canInstallDefaults && sounds.length > 0 && (
        <details className="rounded-xl border border-border/70 bg-muted/30 p-3">
          <summary className="cursor-pointer text-sm font-bold">
            初期4音が足りないとき
          </summary>
          <div className="mt-3">
            <InstallDefaultSoundsButton roomId={roomId} />
          </div>
        </details>
      )}
    </section>
  );
}
