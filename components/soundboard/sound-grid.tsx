"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addPresetSound,
  listPublicLibrarySoundsAction,
} from "@/app/actions/sounds";
import { SoundButton } from "@/components/soundboard/sound-button";
import { VolumeSlider } from "@/components/soundboard/volume-slider";
import { SoundUploadForm } from "@/components/sounds/sound-upload-form";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  hotkeyForIndex,
  matchPadHotkey,
  type PadHotkey,
} from "@/lib/sounds/pad-hotkeys";
import {
  assignHotkeyBinding,
  clearHotkeyBinding,
  effectiveHotkey,
  findSoundIndexByHotkey,
  loadPadKeybinds,
  savePadKeybinds,
} from "@/lib/sounds/pad-keybinds";
import type { AppError } from "@/lib/errors/catalog";
import { E } from "@/lib/errors/catalog";
import { cn } from "@/lib/utils";

type PreloadState = "idle" | "loading" | "done";
type AddStep = "chooser" | "preset" | "upload";

type LibrarySound = {
  file: string;
  name: string;
  buttonColor: string;
  textColor?: string;
  publicUrl: string;
};

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
  isCooling,
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
  isCooling?: (soundId: string) => boolean;
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
  const [librarySounds, setLibrarySounds] = useState<LibrarySound[] | null>(
    null,
  );
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [previewingFile, setPreviewingFile] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [listeningHotkey, setListeningHotkey] = useState(false);
  const [hotkeysEnabled, setHotkeysEnabled] = useState(true);
  const [hotkeyBindings, setHotkeyBindings] = useState<
    Record<string, PadHotkey>
  >({});
  const [pending, startTransition] = useTransition();
  const allowAdd = canUpload && showAddSlots;
  const canEdit = Boolean(onDelete || onRename);
  const canEditPad = Boolean(onRename || canPlay);
  const existingNameSet = new Set(existingSoundNames);
  const editingSound = useMemo(
    () => sounds.find((s) => s.id === editingId) ?? null,
    [sounds, editingId],
  );
  const editingIndex = useMemo(
    () => sounds.findIndex((s) => s.id === editingId),
    [sounds, editingId],
  );

  useEffect(() => {
    const stored = loadPadKeybinds(roomId);
    setHotkeysEnabled(stored.enabled);
    setHotkeyBindings(stored.bindings);
  }, [roomId]);

  const persistKeybinds = useCallback(
    (enabled: boolean, bindings: Record<string, PadHotkey>) => {
      setHotkeysEnabled(enabled);
      setHotkeyBindings(bindings);
      savePadKeybinds(roomId, { enabled, bindings });
    },
    [roomId],
  );

  const filteredLibrary =
    librarySounds?.filter((sound) => {
      const q = libraryQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        sound.name.toLowerCase().includes(q) ||
        sound.file.toLowerCase().includes(q)
      );
    }) ?? [];

  function stopLibraryPreview() {
    const audio = previewAudioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      previewAudioRef.current = null;
    }
    setPreviewingFile(null);
  }

  function openAddDialog() {
    setAddError(null);
    setAddStep("chooser");
    setLibraryQuery("");
    stopLibraryPreview();
    setAddOpen(true);
  }

  function closeAddDialog() {
    setAddOpen(false);
    setAddStep("chooser");
    setAddError(null);
    setAddingPresetFile(null);
    setLibraryQuery("");
    stopLibraryPreview();
  }

  async function openPresetStep() {
    setAddError(null);
    setAddStep("preset");
    setLibraryQuery("");
    stopLibraryPreview();
    if (librarySounds) return;
    setLibraryLoading(true);
    const result = await listPublicLibrarySoundsAction();
    setLibraryLoading(false);
    if (!result.ok) {
      setAddError({ code: result.code, message: result.error });
      return;
    }
    setLibrarySounds(result.data ?? []);
  }

  async function previewLibrarySound(sound: LibrarySound) {
    setAddError(null);
    if (previewingFile === sound.file && previewAudioRef.current) {
      stopLibraryPreview();
      return;
    }

    stopLibraryPreview();
    const audio = new Audio(sound.publicUrl);
    previewAudioRef.current = audio;
    setPreviewingFile(sound.file);
    audio.onended = () => {
      if (previewAudioRef.current === audio) {
        previewAudioRef.current = null;
        setPreviewingFile(null);
      }
    };
    audio.onerror = () => {
      if (previewAudioRef.current === audio) {
        previewAudioRef.current = null;
        setPreviewingFile(null);
      }
      setAddError(E.SOUND_PREVIEW_FAILED);
    };
    try {
      await audio.play();
    } catch {
      if (previewAudioRef.current === audio) {
        previewAudioRef.current = null;
        setPreviewingFile(null);
      }
      setAddError(E.SOUND_PREVIEW_FAILED);
    }
  }

  function addPreset(file: string) {
    setAddError(null);
    stopLibraryPreview();
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

  useEffect(() => {
    return () => {
      const audio = previewAudioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        previewAudioRef.current = null;
      }
    };
  }, []);

  function openPadEdit(sound: BoardSound) {
    setEditingId(sound.id);
    setEditName(sound.name);
    setListeningHotkey(false);
  }

  function closePadEdit() {
    setEditingId(null);
    setEditName("");
    setListeningHotkey(false);
  }

  function commitPadName() {
    if (!onRename || !editingId) return;
    const next = editName.trim();
    const current = sounds.find((s) => s.id === editingId);
    if (!next || !current || current.name === next) return;
    startTransition(async () => {
      const ok = await onRename(editingId, next);
      if (ok) router.refresh();
    });
  }

  function resetPadHotkey() {
    if (!editingId) return;
    persistKeybinds(
      hotkeysEnabled,
      clearHotkeyBinding(hotkeyBindings, editingId),
    );
    setListeningHotkey(false);
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
      if (listeningHotkey && editingId) {
        if (event.key === "Escape") {
          event.preventDefault();
          setListeningHotkey(false);
          return;
        }
        const hotkey = matchPadHotkey(event);
        if (!hotkey) return;
        event.preventDefault();
        event.stopPropagation();
        persistKeybinds(
          hotkeysEnabled,
          assignHotkeyBinding(hotkeyBindings, editingId, hotkey),
        );
        setListeningHotkey(false);
        return;
      }

      if (!hotkeysEnabled) return;
      if (typingTarget(event.target as HTMLElement | null) || addOpen) return;
      if (editingId) return;
      if (event.repeat) return;

      const hotkey = matchPadHotkey(event);
      if (!hotkey) return;
      const index = findSoundIndexByHotkey(hotkey, sounds, hotkeyBindings);
      if (index < 0) return;

      const sound = sounds[index];
      if (!sound) return;
      const isLoop = (sound.playback_mode ?? "one_shot") === "toggle_loop";
      const cooling = isCooling
        ? isCooling(sound.id)
        : Boolean(coolingIds[sound.id]);
      if (!canPlay || (!isLoop && cooling)) return;

      event.preventDefault();
      if (isLoop) {
        if (held.has(sound.id)) return;
        held.add(sound.id);
      }
      onPlay(sound);
    }

    function onKeyUp(event: KeyboardEvent) {
      if (!hotkeysEnabled || listeningHotkey || editingId) return;
      if (typingTarget(event.target as HTMLElement | null) || addOpen) return;
      const hotkey = matchPadHotkey(event);
      if (!hotkey) return;
      const index = findSoundIndexByHotkey(hotkey, sounds, hotkeyBindings);
      const sound = sounds[index];
      if (!sound || (sound.playback_mode ?? "one_shot") !== "toggle_loop") {
        return;
      }
      if (!held.has(sound.id)) return;
      held.delete(sound.id);
      event.preventDefault();
      onStop?.(sound);
    }

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    sounds,
    canPlay,
    coolingIds,
    isCooling,
    onPlay,
    onStop,
    addOpen,
    hotkeysEnabled,
    hotkeyBindings,
    listeningHotkey,
    editingId,
    persistKeybinds,
  ]);

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
      <div className="flex min-h-[16rem] flex-col items-center justify-center gap-3 rounded-[1.75rem] border-2 border-dashed border-[var(--hub-coral)]/35 bg-white/70 px-6 py-10 text-center">
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
            {hotkeysEnabled
              ? "ショートカットON · キーボードでも再生できます"
              : "ショートカットOFF · キーボードでは鳴りません"}
            {allowAdd ? " · 末尾の＋で追加" : ""}
            {canDelete ? " · ゴミ箱で削除" : ""}
            {canEditPad ? " · 鉛筆で名前・キー変更" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            aria-pressed={hotkeysEnabled}
            onClick={() => persistKeybinds(!hotkeysEnabled, hotkeyBindings)}
            className={cn(
              "h-10 rounded-xl px-4 text-sm font-extrabold shadow-sm",
              hotkeysEnabled
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-slate-200 text-slate-600 hover:bg-slate-300",
            )}
          >
            {hotkeysEnabled ? "ショートカットON" : "ショートカットOFF"}
          </Button>
          {onPreloadAll && sounds.length > 0 && (
            <Button
              type="button"
              size="sm"
              disabled={preloadState === "loading"}
              onClick={onPreloadAll}
              className={cn(
                "h-10 rounded-xl px-4 text-sm font-extrabold shadow-sm",
                preloadState === "done"
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-sky-500 text-white hover:bg-sky-600",
              )}
            >
              {preloadState === "loading"
                ? "読み込み中…"
                : preloadState === "done"
                  ? "読み込み済み"
                  : "サウンドを一括読み込み"}
            </Button>
          )}
        </div>
      </div>

      <div
        className="grid grid-cols-3 gap-2.5 sm:gap-3"
        role="group"
        aria-label="ぽんだしサウンドボード"
      >
        {Array.from({ length: totalSlots }, (_, index) => {
          const sound = sounds[index];
          const slotHotkey = hotkeyForIndex(index);

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
                  slotHotkey
                    ? `サウンドを追加（キー ${slotHotkey} 枠）`
                    : "サウンドを追加"
                }
              >
                {slotHotkey ? (
                  <span className="absolute left-3 top-2.5 font-display text-2xl font-semibold tracking-tight text-muted-foreground/40">
                    {slotHotkey}
                  </span>
                ) : null}
                <PlusIcon className="size-10 stroke-[2]" />
              </button>
            );
          }

          const cooling = isCooling
            ? isCooling(sound.id)
            : Boolean(coolingIds[sound.id]);
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
          const busyEdit = pending && editingId === sound.id;
          const hotkey = effectiveHotkey(sound.id, index, hotkeyBindings);
          const showPadChrome = Boolean(canEdit || onVolumeChange || canEditPad);

          return (
            <div
              key={sound.id}
              className="flex aspect-square flex-col overflow-hidden rounded-[1.6rem] border border-border/70 bg-white/95 shadow-[0_10px_24px_-16px_rgba(15,23,42,0.35)]"
            >
              <div className="relative min-h-0 flex-1">
                <SoundButton
                  name={sound.name}
                  buttonColor={sound.button_color}
                  textColor={sound.text_color}
                  hotkey={hotkeysEnabled ? hotkey : null}
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
                    busyEdit ||
                    (!holdMode && cooling)
                  }
                  holdMode={holdMode}
                  onPress={() => onPlay(sound)}
                  onPressEnd={() => onStop?.(sound)}
                  className={cn(
                    "size-full rounded-none border-0 shadow-none",
                    showPadChrome ? "rounded-t-[1.45rem]" : "rounded-[1.45rem]",
                    "hover:translate-y-0 hover:shadow-none",
                  )}
                />
                <button
                  type="button"
                  className="absolute right-1.5 top-1.5 z-20 flex size-7 items-center justify-center rounded-full bg-white/75 text-sm text-[var(--hub-coral)] shadow-sm backdrop-blur-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              {showPadChrome && (
                <div className="flex shrink-0 flex-col gap-1 border-t border-border/60 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] px-1.5 py-1.5">
                  <div className="flex min-h-7 items-center gap-0.5">
                    {canDelete && onDelete && (
                      <button
                        type="button"
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        aria-label={`${sound.name}を削除`}
                        disabled={busyDelete || busyEdit}
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
                        <TrashIcon className="size-3.5" />
                      </button>
                    )}
                    {canEditPad && (
                      <button
                        type="button"
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        aria-label={`${sound.name}の設定（名前・キー）`}
                        title="名前・キーを変更"
                        disabled={busyDelete || busyEdit}
                        onClick={(e) => {
                          e.stopPropagation();
                          openPadEdit(sound);
                        }}
                      >
                        <PencilIcon className="size-3.5" />
                      </button>
                    )}
                    {onVolumeChange && (
                      <label
                        htmlFor={`pad-vol-${sound.id}`}
                        className="ml-1 truncate text-[10px] font-bold text-muted-foreground"
                      >
                        音量
                        <span className="ml-1 text-foreground">
                          {Math.round(
                            Math.min(1, Math.max(0, Number(sound.volume))) *
                              100,
                          )}
                          %
                        </span>
                      </label>
                    )}
                  </div>
                  {onVolumeChange && (
                    <VolumeSlider
                      id={`pad-vol-${sound.id}`}
                      label="音量"
                      size="sm"
                      hideLabel
                      className="mx-auto w-[80%] min-w-0"
                      value={Number(sound.volume)}
                      onChange={(v) => onVolumeChange(sound.id, v)}
                      onCommit={(v) => onVolumeCommit?.(sound.id, v)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingSound && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onClick={closePadEdit}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="パッド設定"
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  パッド設定
                </h2>
                <p className="text-xs font-semibold text-muted-foreground">
                  名前とキー割り当てを変更できます
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={closePadEdit}
              >
                閉じる
              </Button>
            </div>

            {onRename && (
              <div className="space-y-2">
                <Label htmlFor="pad-edit-name">名前</Label>
                <div className="flex gap-2">
                  <Input
                    id="pad-edit-name"
                    value={editName}
                    maxLength={40}
                    disabled={pending}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitPadName();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    disabled={pending}
                    onClick={commitPadName}
                  >
                    保存
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>キー割り当て</Label>
              <div className="rounded-xl border border-border/70 bg-slate-50 px-3 py-3">
                <p className="text-sm font-bold">
                  現在:{" "}
                  <span className="font-display text-lg tracking-tight">
                    {effectiveHotkey(
                      editingSound.id,
                      editingIndex,
                      hotkeyBindings,
                    ) ?? "なし"}
                  </span>
                  {!hotkeysEnabled && (
                    <span className="ml-2 text-xs font-semibold text-amber-700">
                      （全体OFF中）
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  {listeningHotkey
                    ? "割り当てたいキーを押してください（Escでキャンセル）"
                    : "1–9 / QWERTY などパッド用キーに変更できます"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={listeningHotkey ? "default" : "secondary"}
                    onClick={() => setListeningHotkey((v) => !v)}
                  >
                    {listeningHotkey ? "キー待ち…" : "キーを変更"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetPadHotkey}
                    disabled={!hotkeyBindings[editingSound.id]}
                  >
                    初期キーに戻す
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl"
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
                      ? "サウンドを選択"
                      : "ファイルをアップロード"}
                </h2>
                <p className="text-xs font-semibold text-muted-foreground">
                  {addStep === "chooser"
                    ? "用意済みの効果音を選ぶか、自分の音声をアップロードできます"
                    : addStep === "preset"
                      ? "試聴してから追加できます"
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
                      stopLibraryPreview();
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
                  onClick={() => void openPresetStep()}
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
              <div className="space-y-3">
                <Input
                  type="search"
                  value={libraryQuery}
                  onChange={(e) => setLibraryQuery(e.target.value)}
                  placeholder="名前で検索…"
                  aria-label="サウンドを検索"
                  disabled={libraryLoading || !librarySounds}
                />
                {libraryLoading ? (
                  <p className="py-8 text-center text-sm font-semibold text-muted-foreground">
                    読み込み中…
                  </p>
                ) : filteredLibrary.length === 0 ? (
                  <p className="py-8 text-center text-sm font-semibold text-muted-foreground">
                    {librarySounds?.length
                      ? "一致するサウンドがありません"
                      : "選べるサウンドがありません"}
                  </p>
                ) : (
                  <div className="grid max-h-[min(60vh,28rem)] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                    {filteredLibrary.map((preset) => {
                      const taken = existingNameSet.has(preset.name);
                      const busy = pending && addingPresetFile === preset.file;
                      const previewing = previewingFile === preset.file;
                      return (
                        <div
                          key={preset.file}
                          className={cn(
                            "flex min-h-[4.75rem] flex-col justify-between gap-2 rounded-xl border border-white/80 px-3 py-2 shadow-sm",
                            taken && "opacity-70",
                          )}
                          style={{
                            background: `linear-gradient(160deg, color-mix(in srgb, ${preset.buttonColor} 30%, white), ${preset.buttonColor})`,
                            color: preset.textColor ?? "#ffffff",
                          }}
                        >
                          <span className="text-sm font-extrabold leading-snug">
                            {busy ? "追加中…" : preset.name}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => void previewLibrarySound(preset)}
                              className="rounded-lg bg-black/20 px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm transition hover:bg-black/30"
                            >
                              {previewing ? "停止" : "試聴"}
                            </button>
                            <button
                              type="button"
                              disabled={taken || pending}
                              onClick={() => addPreset(preset.file)}
                              className={cn(
                                "rounded-lg px-2.5 py-1 text-[11px] font-bold transition",
                                taken
                                  ? "cursor-not-allowed bg-black/10 opacity-70"
                                  : "bg-white/85 text-slate-800 hover:bg-white",
                              )}
                            >
                              {taken ? "追加済み" : "追加"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
