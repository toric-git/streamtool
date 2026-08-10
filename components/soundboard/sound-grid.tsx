"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SoundButton } from "@/components/soundboard/sound-button";
import { VolumeSlider } from "@/components/soundboard/volume-slider";
import { SoundUploadForm } from "@/components/sounds/sound-upload-form";
import { Button } from "@/components/ui/button";
import {
  hotkeyForIndex,
  indexForHotkey,
  matchPadHotkey,
} from "@/lib/sounds/pad-hotkeys";
import { cn } from "@/lib/utils";

export type BoardSound = {
  id: string;
  name: string;
  audio_path: string;
  button_color: string;
  text_color: string;
  image_path: string | null;
  volume: number;
  cooldown_ms: number;
  category_id: string | null;
};

const MIN_PAD_SLOTS = 9;

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function SoundGrid({
  roomId,
  categories,
  sounds,
  emptyMessage,
  canUpload,
  canDelete,
  imageUrls,
  playingIds,
  coolingIds,
  cooldownProgress,
  canPlay,
  isFavorite,
  onPlay,
  onToggleFavorite,
  onDelete,
  onVolumeChange,
  onVolumeCommit,
  defaultCategoryId = "",
  showAddSlots = true,
}: {
  roomId: string;
  categories: { id: string; name: string }[];
  sounds: BoardSound[];
  emptyMessage: string;
  canUpload: boolean;
  canDelete: boolean;
  imageUrls: Record<string, string>;
  playingIds: string[];
  coolingIds: Record<string, boolean>;
  cooldownProgress: Record<string, number>;
  canPlay: boolean;
  isFavorite: (soundId: string) => boolean;
  onPlay: (sound: BoardSound) => void;
  onToggleFavorite: (soundId: string) => void;
  onDelete?: (soundId: string) => Promise<boolean>;
  onVolumeChange?: (soundId: string, volume: number) => void;
  onVolumeCommit?: (soundId: string, volume: number) => void;
  defaultCategoryId?: string;
  /** When false (e.g. favorites filter), hide empty + pads. */
  showAddSlots?: boolean;
}) {
  const router = useRouter();
  const titleId = useId();
  const [addOpen, setAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const allowAdd = canUpload && showAddSlots;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (addOpen) return;

      const hotkey = matchPadHotkey(event);
      if (!hotkey) return;
      const index = indexForHotkey(hotkey);
      if (index < 0 || index >= sounds.length) return;

      const sound = sounds[index];
      if (!sound) return;
      if (!canPlay || coolingIds[sound.id]) return;

      event.preventDefault();
      onPlay(sound);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sounds, canPlay, coolingIds, onPlay, addOpen]);

  useEffect(() => {
    if (!addOpen) return;
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAddOpen(false);
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [addOpen]);

  const emptySlotCount = allowAdd
    ? Math.max(1, MIN_PAD_SLOTS - sounds.length)
    : 0;
  const totalSlots = sounds.length + emptySlotCount;

  if (sounds.length === 0 && !allowAdd) {
    return (
      <div className="flex min-h-[22rem] flex-col items-center justify-center gap-4 rounded-[1.75rem] border-2 border-dashed border-[var(--hub-coral)]/35 bg-white/70 px-6 py-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <div className="grid w-full max-w-md grid-cols-3 gap-2 opacity-40" aria-hidden>
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl bg-gradient-to-br from-pink-100 to-sky-100"
            />
          ))}
        </div>
        <p className="font-display text-xl font-semibold tracking-tight">
          ぽんだしボード
        </p>
        <p className="max-w-sm text-sm font-semibold text-muted-foreground">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight">
            ぽんだしパッド
          </p>
          <p className="text-xs font-bold text-muted-foreground">
            キー 1 2 3 / Q W E / A S D でも再生できます
            {allowAdd ? " · 空欄の＋で追加" : ""}
            {canDelete ? " · ゴミ箱で削除" : ""}
          </p>
        </div>
      </div>

      <div
        className="grid grid-cols-3 gap-2.5 sm:gap-3"
        role="group"
        aria-label="ぽんだしサウンドボード"
      >
        {Array.from({ length: totalSlots }, (_, index) => {
          const sound = sounds[index];
          const hotkey = hotkeyForIndex(index);

          if (!sound) {
            return (
              <button
                key={`empty-${index}`}
                type="button"
                disabled={!allowAdd}
                onClick={() => setAddOpen(true)}
                className={cn(
                  "group relative flex aspect-square w-full min-h-[7.5rem] flex-col items-center justify-center gap-2 rounded-[1.35rem] border-2 border-dashed border-[var(--hub-coral)]/40 bg-white/70 px-3 text-[var(--hub-coral)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition",
                  "hover:-translate-y-0.5 hover:border-[var(--hub-coral)] hover:bg-[linear-gradient(160deg,#fff7fb,#eef9ff)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:opacity-50",
                )}
                aria-label={
                  hotkey
                    ? `サウンドを追加（キー ${hotkey} 枠）`
                    : "サウンドを追加"
                }
              >
                {hotkey ? (
                  <span className="absolute left-3 top-2.5 font-display text-2xl font-semibold tracking-tight text-muted-foreground/50">
                    {hotkey}
                  </span>
                ) : null}
                <span className="flex size-12 items-center justify-center rounded-full bg-[var(--hub-coral)]/10 transition group-hover:bg-[var(--hub-coral)]/15">
                  <PlusIcon className="size-7" />
                </span>
                <span className="text-sm font-extrabold">追加</span>
              </button>
            );
          }

          const cooling = Boolean(coolingIds[sound.id]);
          const state = playingIds.includes(sound.id)
            ? "playing"
            : cooling
              ? "cooldown"
              : !canPlay
                ? "disabled"
                : "idle";
          const fav = isFavorite(sound.id);
          const busyDelete = pending && deletingId === sound.id;

          return (
            <div key={sound.id} className="space-y-1.5">
              <div className="relative">
                <SoundButton
                  name={sound.name}
                  buttonColor={sound.button_color}
                  textColor={sound.text_color}
                  hotkey={hotkey}
                  imageUrl={
                    sound.image_path
                      ? (imageUrls[sound.image_path] ?? null)
                      : null
                  }
                  state={state}
                  cooldownProgress={
                    cooling ? (cooldownProgress[sound.id] ?? 1) : 0
                  }
                  disabled={!canPlay || cooling || busyDelete}
                  onPress={() => onPlay(sound)}
                />
                {canDelete && onDelete && (
                  <button
                    type="button"
                    className="absolute left-1.5 top-1.5 z-20 flex size-8 items-center justify-center rounded-full bg-white/80 text-rose-600 shadow-sm backdrop-blur-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    aria-label={`${sound.name}を削除`}
                    disabled={busyDelete}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        !window.confirm(
                          `「${sound.name}」を削除しますか？\nパッドから消えて元に戻せません。`,
                        )
                      ) {
                        return;
                      }
                      setDeletingId(sound.id);
                      startTransition(async () => {
                        const ok = await onDelete(sound.id);
                        setDeletingId(null);
                        if (ok) router.refresh();
                      });
                    }}
                  >
                    <TrashIcon className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  className="absolute right-1.5 top-1.5 z-20 flex size-8 items-center justify-center rounded-full bg-white/75 text-sm text-[var(--hub-coral)] shadow-sm backdrop-blur-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={
                    fav
                      ? `${sound.name}をお気に入りから外す`
                      : `${sound.name}をお気に入りに追加`
                  }
                  aria-pressed={fav}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(sound.id);
                  }}
                >
                  {fav ? "★" : "☆"}
                </button>
              </div>
              {onVolumeChange && (
                <div className="rounded-xl border border-border/70 bg-white/90 px-2 py-1.5">
                  <VolumeSlider
                    id={`pad-vol-${sound.id}`}
                    label="音量"
                    size="sm"
                    value={Number(sound.volume)}
                    onChange={(v) => onVolumeChange(sound.id, v)}
                    onCommit={(v) => onVolumeCommit?.(sound.id, v)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onClick={() => setAddOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2
                  id={titleId}
                  className="font-display text-lg font-semibold tracking-tight"
                >
                  サウンドを追加
                </h2>
                <p className="text-xs font-semibold text-muted-foreground">
                  空のパッドに新しい音を登録します
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setAddOpen(false)}
              >
                閉じる
              </Button>
            </div>
            <SoundUploadForm
              roomId={roomId}
              categories={categories}
              canUpload={canUpload}
              compact
              defaultCategoryId={defaultCategoryId}
              onSuccess={() => {
                setAddOpen(false);
                router.refresh();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
