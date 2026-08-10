"use client";

import { useEffect } from "react";
import { SoundButton } from "@/components/soundboard/sound-button";
import { VolumeSlider } from "@/components/soundboard/volume-slider";
import {
  hotkeyForIndex,
  indexForHotkey,
  matchPadHotkey,
} from "@/lib/sounds/pad-hotkeys";

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

export function SoundGrid({
  sounds,
  emptyMessage,
  canManageSounds,
  imageUrls,
  playingIds,
  coolingIds,
  cooldownProgress,
  canPlay,
  isFavorite,
  onPlay,
  onToggleFavorite,
  onVolumeChange,
  onVolumeCommit,
}: {
  sounds: BoardSound[];
  emptyMessage: string;
  canManageSounds?: boolean;
  imageUrls: Record<string, string>;
  playingIds: string[];
  coolingIds: Record<string, boolean>;
  cooldownProgress: Record<string, number>;
  canPlay: boolean;
  isFavorite: (soundId: string) => boolean;
  onPlay: (sound: BoardSound) => void;
  onToggleFavorite: (soundId: string) => void;
  onVolumeChange?: (soundId: string, volume: number) => void;
  onVolumeCommit?: (soundId: string, volume: number) => void;
}) {
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
  }, [sounds, canPlay, coolingIds, onPlay]);

  if (sounds.length === 0) {
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
          ぽんだしボードを準備しよう
        </p>
        <p className="max-w-sm text-sm font-semibold text-muted-foreground">
          {emptyMessage}
        </p>
        {canManageSounds && (
          <p className="text-xs font-bold text-[var(--hub-coral)]">
            ↓ 下の「サウンドの追加・削除」から始められます
          </p>
        )}
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
            {canManageSounds ? " · 各パッド下で音量調整" : ""}
          </p>
        </div>
      </div>

      <div
        className="grid grid-cols-3 gap-2.5 sm:gap-3"
        role="group"
        aria-label="ぽんだしサウンドボード"
      >
        {sounds.map((sound, index) => {
          const cooling = Boolean(coolingIds[sound.id]);
          const state = playingIds.includes(sound.id)
            ? "playing"
            : cooling
              ? "cooldown"
              : !canPlay
                ? "disabled"
                : "idle";
          const fav = isFavorite(sound.id);
          const hotkey = hotkeyForIndex(index);

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
                  disabled={!canPlay || cooling}
                  onPress={() => onPlay(sound)}
                />
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
              {canManageSounds && onVolumeChange && (
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
    </div>
  );
}
