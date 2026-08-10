"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPresetSound } from "@/app/actions/sounds";
import { SoundButton } from "@/components/soundboard/sound-button";
import { VolumeSlider } from "@/components/soundboard/volume-slider";
import { SoundUploadForm } from "@/components/sounds/sound-upload-form";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Input } from "@/components/ui/input";
import {
  hotkeyForIndex,
  indexForHotkey,
  matchPadHotkey,
} from "@/lib/sounds/pad-hotkeys";
import { PRESET_LIBRARY_SOUNDS } from "@/lib/sounds/default-stream-sounds";
import type { AppError } from "@/lib/errors/catalog";
import { cn } from "@/lib/utils";

type PreloadState = "idle" | "loading" | "done";
type AddStep = "chooser" | "preset" | "upload";

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
  playback_mode?: "one_shot" | "toggle_loop";
  sort_order?: number;
};

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

function PencilIcon({ className }: { className?: string }) {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
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
  onStop,
  onToggleFavorite,
  onDelete,
  onRename,
  onVolumeChange,
  onVolumeCommit,
  onPreloadAll,
  preloadState = "idle",
  defaultCategoryId = "",
  showAddSlots = true,
  existingSoundNames = [],
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
  onStop?: (sound: BoardSound) => void;
  onToggleFavorite: (soundId: string) => void;
  onDelete?: (soundId: string) => Promise<boolean>;
  onRename?: (soundId: string, name: string) => Promise<boolean>;
  onVolumeChange?: (soundId: string, volume: number) => void;
  onVolumeCommit?: (soundId: string, volume: number) => void;
  onPreloadAll?: () => void;
  preloadState?: PreloadState;
  defaultCategoryId?: string;
  /** When false (e.g. favorites filter), hide empty + pads. */
  showAddSlots?: boolean;
  /** Room-wide names used to disable already-added presets. */
  existingSoundNames?: string[];
}) {
  const router = useRouter();
  const titleId = useId();
  const [addOpen, setAddOpen] = useState(false);
  const [addStep, setAddStep] = useState<AddStep>("chooser");
  const [addError, setAddError] = useState<AppError | null>(null);
  const [addingPresetFile, setAddingPresetFile] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const skipRenameBlurRef = useRef(false);
  const [pending, startTransition] = useTransition();
  const allowAdd = canUpload && showAddSlots;
  const canEdit = Boolean(onDelete || onRename);
  const existingNameSet = new Set(existingSoundNames);

  function openAddDialog() {
    setAddError(null);
    setAddStep("chooser");
    setAddOpen(true);
  }

  function closeAddDialog() {
    setAddOpen(false);
    setAddStep("chooser");
    setAddError(null);
    setAddingPresetFile(null);
  }

  function addPreset(file: string) {
    setAddError(null);
    setAddingPresetFile(file);
    startTransition(async () => {
      const result = await addPresetSound(
        roomId,
        file,
        defaultCategoryId || null,
      );
      setAddingPresetFile(null);
      if (!result.ok) {
        setAddError({ code: result.code, message: result.error });
        return;
      }
      closeAddDialog();
      router.refresh();
    });
  }

  function startRename(sound: BoardSound) {
    if (!onRename) return;
    skipRenameBlurRef.current = false;
    setRenamingId(sound.id);
    setRenameDraft(sound.name);
  }

  function cancelRename() {
    skipRenameBlurRef.current = true;
    setRenamingId(null);
  }

  function commitRename(soundId: string) {
    if (skipRenameBlurRef.current) {
      skipRenameBlurRef.current = false;
      return;
    }
    if (!onRename) {
      setRenamingId(null);
      return;
    }
    const next = renameDraft.trim();
    const current = sounds.find((s) => s.id === soundId);
    setRenamingId(null);
    if (!next || !current || current.name === next) return;

    startTransition(async () => {
      const ok = await onRename(soundId, next);
      if (ok) router.refresh();
    });
  }

  useEffect(() => {
    const held = new Set<string>();

    function typingTarget(target: HTMLElement | null) {
      return Boolean(
        target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable),
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      if (typingTarget(event.target as HTMLElement | null) || addOpen) return;
      if (event.repeat) return;

      const hotkey = matchPadHotkey(event);
      if (!hotkey) return;
      const index = indexForHotkey(hotkey);
      if (index < 0 || index >= sounds.length) return;

      const sound = sounds[index];
      if (!sound) return;
      const isLoop = (sound.playback_mode ?? "one_shot") === "toggle_loop";
      if (!canPlay || (!isLoop && coolingIds[sound.id])) return;

      event.preventDefault();
      if (isLoop) {
        if (held.has(sound.id)) return;
        held.add(sound.id);
      }
      onPlay(sound);
    }

    function onKeyUp(event: KeyboardEvent) {
      if (typingTarget(event.target as HTMLElement | null) || addOpen) return;
      const hotkey = matchPadHotkey(event);
      if (!hotkey) return;
      const index = indexForHotkey(hotkey);
      const sound = sounds[index];
      if (!sound || (sound.playback_mode ?? "one_shot") !== "toggle_loop") {
        return;
      }
      if (!held.has(sound.id)) return;
      held.delete(sound.id);
      event.preventDefault();
      onStop?.(sound);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [sounds, canPlay, coolingIds, onPlay, onStop, addOpen]);

  useEffect(() => {
    if (!addOpen) return;
    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (addStep !== "chooser") {
        setAddStep("chooser");
        setAddError(null);
        return;
      }
      closeAddDialog();
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [addOpen, addStep]);

  // One colorless "+" pad at the end of the row (not a full empty grid).
  const emptySlotCount = allowAdd ? 1 : 0;
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
            {allowAdd ? " · 末尾の＋で追加" : ""}
            {canDelete ? " · ゴミ箱で削除" : ""}
            {onRename ? " · 鉛筆で改名" : ""}
          </p>
        </div>
        {onPreloadAll && sounds.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={preloadState === "loading"}
            onClick={onPreloadAll}
          >
            {preloadState === "loading"
              ? "読み込み中…"
              : preloadState === "done"
                ? "読み込み済み"
                : "全てを読み込む"}
          </Button>
        )}
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
                onClick={openAddDialog}
                className={cn(
                  "group relative flex aspect-square w-full min-h-[7.5rem] flex-col items-center justify-center gap-2 rounded-[1.35rem] border-2 border-dashed border-slate-300/80 bg-transparent px-3 text-slate-500 transition",
                  "hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white/50 hover:text-slate-700",
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
                  <span className="absolute left-3 top-2.5 font-display text-2xl font-semibold tracking-tight text-muted-foreground/40">
                    {hotkey}
                  </span>
                ) : null}
                <PlusIcon className="size-10 stroke-[2]" />
              </button>
            );
          }

          const cooling = Boolean(coolingIds[sound.id]);
          const holdMode =
            (sound.playback_mode ?? "one_shot") === "toggle_loop";
          const state = playingIds.includes(sound.id)
            ? "playing"
            : cooling && !holdMode
              ? "cooldown"
              : !canPlay
                ? "disabled"
                : "idle";
          const fav = isFavorite(sound.id);
          const busyDelete = pending && deletingId === sound.id;
          const busyRename = pending && renamingId === sound.id;
          const isRenaming = renamingId === sound.id;

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
                    cooling && !holdMode
                      ? (cooldownProgress[sound.id] ?? 1)
                      : 0
                  }
                  disabled={
                    !canPlay ||
                    busyDelete ||
                    busyRename ||
                    isRenaming ||
                    (!holdMode && cooling)
                  }
                  holdMode={holdMode}
                  onPress={() => onPlay(sound)}
                  onPressEnd={() => onStop?.(sound)}
                />
                {canEdit && (
                  <div className="absolute left-1.5 top-1.5 z-20 flex items-center gap-1">
                    {canDelete && onDelete && (
                      <button
                        type="button"
                        className="flex size-8 items-center justify-center rounded-full bg-white/80 text-rose-600 shadow-sm backdrop-blur-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        aria-label={`${sound.name}を削除`}
                        disabled={busyDelete || busyRename || isRenaming}
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
                    {onRename && (
                      <button
                        type="button"
                        className="flex size-8 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow-sm backdrop-blur-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        aria-label={`${sound.name}の名前を変更`}
                        title="名前を変更"
                        disabled={busyDelete || busyRename}
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(sound);
                        }}
                      >
                        <PencilIcon className="size-3.5" />
                      </button>
                    )}
                  </div>
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
                {isRenaming && (
                  <form
                    className="absolute inset-x-2 bottom-2 z-30"
                    onSubmit={(e) => {
                      e.preventDefault();
                      commitRename(sound.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Input
                      autoFocus
                      value={renameDraft}
                      maxLength={40}
                      disabled={pending}
                      aria-label="サウンド名"
                      className="h-9 border-white/90 bg-white/95 text-sm font-bold shadow-md"
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onBlur={() => commitRename(sound.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          e.preventDefault();
                          cancelRename();
                        }
                      }}
                    />
                  </form>
                )}
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
          onClick={closeAddDialog}
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
                  {addStep === "chooser"
                    ? "サウンドを追加"
                    : addStep === "preset"
                      ? "プリセットから選ぶ"
                      : "ファイルをアップロード"}
                </h2>
                <p className="text-xs font-semibold text-muted-foreground">
                  {addStep === "chooser"
                    ? "プリセットを選ぶか、自分の音声をアップロードできます"
                    : addStep === "preset"
                      ? "タップで今のパッドに追加します"
                      : "空のパッドに新しい音を登録します"}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {addStep !== "chooser" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setAddStep("chooser");
                      setAddError(null);
                    }}
                  >
                    戻る
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={closeAddDialog}
                >
                  閉じる
                </Button>
              </div>
            </div>

            {addError && <ErrorAlert error={addError} className="mb-3" />}

            {addStep === "chooser" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="flex flex-col items-start gap-2 rounded-2xl border-2 border-[var(--hub-coral)]/30 bg-[linear-gradient(160deg,#fff7fb,#ffffff)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--hub-coral)]/60"
                  onClick={() => setAddStep("preset")}
                >
                  <span className="font-display text-base font-semibold tracking-tight">
                    サウンドを選択
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    用意済みの効果音から追加
                  </span>
                </button>
                <button
                  type="button"
                  className="flex flex-col items-start gap-2 rounded-2xl border-2 border-sky-200/80 bg-[linear-gradient(160deg,#eef9ff,#ffffff)] p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-300"
                  onClick={() => setAddStep("upload")}
                >
                  <span className="font-display text-base font-semibold tracking-tight">
                    アップロード
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    自分の音声ファイルを登録
                  </span>
                </button>
              </div>
            )}

            {addStep === "preset" && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PRESET_LIBRARY_SOUNDS.map((preset) => {
                  const taken = existingNameSet.has(preset.name);
                  const busy = pending && addingPresetFile === preset.file;
                  return (
                    <button
                      key={preset.file}
                      type="button"
                      disabled={taken || pending}
                      onClick={() => addPreset(preset.file)}
                      className={cn(
                        "flex min-h-[4.5rem] flex-col justify-end rounded-xl border border-white/80 px-3 py-2 text-left shadow-sm transition",
                        taken
                          ? "cursor-not-allowed opacity-45"
                          : "hover:-translate-y-0.5 hover:brightness-105",
                      )}
                      style={{
                        background: `linear-gradient(160deg, color-mix(in srgb, ${preset.buttonColor} 30%, white), ${preset.buttonColor})`,
                        color: preset.textColor ?? "#ffffff",
                      }}
                    >
                      <span className="text-sm font-extrabold leading-snug">
                        {busy ? "追加中…" : preset.name}
                      </span>
                      {taken ? (
                        <span className="mt-1 text-[10px] font-bold opacity-80">
                          追加済み
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}

            {addStep === "upload" && (
              <SoundUploadForm
                roomId={roomId}
                categories={categories}
                canUpload={canUpload}
                compact
                defaultCategoryId={defaultCategoryId}
                onSuccess={() => {
                  closeAddDialog();
                  router.refresh();
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
