"use client";

import { cn } from "@/lib/utils";

export type SoundButtonState =
  | "idle"
  | "hover"
  | "pressed"
  | "playing"
  | "cooldown"
  | "loading"
  | "disabled"
  | "error";

type Props = {
  name: string;
  buttonColor: string;
  textColor: string;
  imageUrl?: string | null;
  hotkey?: string | null;
  state?: SoundButtonState;
  cooldownProgress?: number; // 0..1 remaining ratio
  onPress?: () => void;
  disabled?: boolean;
};

export function SoundButton({
  name,
  buttonColor,
  textColor,
  imageUrl,
  hotkey,
  state = "idle",
  cooldownProgress = 0,
  onPress,
  disabled,
}: Props) {
  const isDisabled =
    disabled || state === "disabled" || state === "loading" || state === "cooldown";

  return (
    <button
      type="button"
      aria-label={hotkey ? `${name}（キー ${hotkey}）` : name}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      onClick={onPress}
      className={cn(
        "group relative flex aspect-square w-full min-h-[7.5rem] flex-col overflow-hidden rounded-[1.35rem] border-2 border-white/80 px-3 pb-3 pt-2.5 text-left shadow-[0_10px_24px_-16px_rgba(255,77,141,0.55)] transition duration-150",
        "hover:-translate-y-0.5 hover:brightness-[1.04] hover:shadow-[0_16px_28px_-14px_rgba(255,77,141,0.45)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "active:translate-y-0 active:scale-[0.97]",
        state === "playing" && "ring-4 ring-[var(--hub-sky)] ring-offset-2",
        state === "error" && "ring-2 ring-destructive",
        state === "pressed" && "scale-[0.97]",
        isDisabled && "opacity-55 hover:translate-y-0 hover:brightness-100",
      )}
      style={{
        background: imageUrl
          ? undefined
          : `linear-gradient(155deg, color-mix(in srgb, ${buttonColor} 58%, white) 0%, ${buttonColor} 48%, color-mix(in srgb, ${buttonColor} 82%, #1f1630) 100%)`,
        color: textColor,
      }}
    >
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      )}
      {imageUrl && <span className="absolute inset-0 bg-black/40" aria-hidden />}

      <span
        className="pointer-events-none absolute inset-x-3 top-2 h-10 rounded-full bg-white/25 blur-md"
        aria-hidden
      />

      {state === "cooldown" && (
        <span
          className="absolute inset-x-0 bottom-0 bg-black/35"
          style={{ height: `${Math.round(cooldownProgress * 100)}%` }}
          aria-hidden
        />
      )}

      {hotkey ? (
        <span className="relative z-10 flex flex-col leading-none">
          <span className="font-display text-3xl font-semibold tracking-tight drop-shadow-sm sm:text-4xl">
            {hotkey}
          </span>
          <span className="mt-0.5 text-[0.65rem] font-extrabold tracking-[0.18em] opacity-80">
            KEY
          </span>
        </span>
      ) : (
        <span className="relative z-10 h-10" aria-hidden />
      )}

      <span className="relative z-10 mt-auto line-clamp-2 text-center text-sm font-extrabold leading-snug drop-shadow-sm sm:text-base">
        {name}
      </span>

      {state === "loading" && <span className="sr-only">読み込み中</span>}
      {state === "playing" && <span className="sr-only">再生中</span>}
      {state === "cooldown" && <span className="sr-only">クールダウン中</span>}
      {state === "error" && <span className="sr-only">エラー</span>}
    </button>
  );
}
