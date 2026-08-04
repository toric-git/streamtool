"use client";

import { SoundButton } from "@/components/soundboard/sound-button";

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
  imageUrls,
  playingIds,
  coolingIds,
  cooldownProgress,
  canPlay,
  isFavorite,
  onPlay,
  onToggleFavorite,
}: {
  sounds: BoardSound[];
  emptyMessage: string;
  imageUrls: Record<string, string>;
  playingIds: string[];
  coolingIds: Record<string, boolean>;
  cooldownProgress: Record<string, number>;
  canPlay: boolean;
  isFavorite: (soundId: string) => boolean;
  onPlay: (sound: BoardSound) => void;
  onToggleFavorite: (soundId: string) => void;
}) {
  if (sounds.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {sounds.map((sound) => {
        const cooling = Boolean(coolingIds[sound.id]);
        const state = playingIds.includes(sound.id)
          ? "playing"
          : cooling
            ? "cooldown"
            : !canPlay
              ? "disabled"
              : "idle";
        const fav = isFavorite(sound.id);
        return (
          <div key={sound.id} className="relative">
            <SoundButton
              name={sound.name}
              buttonColor={sound.button_color}
              textColor={sound.text_color}
              imageUrl={
                sound.image_path ? (imageUrls[sound.image_path] ?? null) : null
              }
              state={state}
              cooldownProgress={cooling ? (cooldownProgress[sound.id] ?? 1) : 0}
              disabled={!canPlay || cooling}
              onPress={() => onPlay(sound)}
            />
            <button
              type="button"
              className="absolute right-1 top-1 z-20 flex size-8 items-center justify-center rounded-full bg-black/40 text-sm text-white hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        );
      })}
    </div>
  );
}
