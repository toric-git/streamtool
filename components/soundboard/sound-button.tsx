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
      aria-label={name}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      onClick={onPress}
      className={cn(
        "relative flex min-h-20 min-w-[44px] items-center justify-center overflow-hidden rounded-2xl border-2 border-white/70 px-3 py-5 text-center text-base font-extrabold transition duration-150 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]",
        state === "playing" && "ring-4 ring-sky-300",
        state === "error" && "ring-2 ring-destructive",
        state === "pressed" && "scale-[0.97]",
        isDisabled && "opacity-55",
      )}
      style={{
        backgroundColor: imageUrl ? undefined : buttonColor,
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
      {imageUrl && <span className="absolute inset-0 bg-black/45" aria-hidden />}
      {state === "cooldown" && (
        <span
          className="absolute inset-x-0 bottom-0 bg-black/35"
          style={{ height: `${Math.round(cooldownProgress * 100)}%` }}
          aria-hidden
        />
      )}
      <span className="relative z-10 drop-shadow-sm">{name}</span>
      {state === "loading" && (
        <span className="sr-only">読み込み中</span>
      )}
      {state === "playing" && <span className="sr-only">再生中</span>}
      {state === "cooldown" && <span className="sr-only">クールダウン中</span>}
      {state === "error" && <span className="sr-only">エラー</span>}
    </button>
  );
}
