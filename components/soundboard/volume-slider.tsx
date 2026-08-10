"use client";

import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
  disabled?: boolean;
  className?: string;
  /** Compact for pad / list rows */
  size?: "md" | "sm";
};

export function VolumeSlider({
  id,
  label,
  value,
  onChange,
  onCommit,
  disabled,
  className,
  size = "md",
}: Props) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        size === "sm" ? "gap-1.5" : "gap-3",
        className,
      )}
    >
      <label
        htmlFor={id}
        className={cn(
          "shrink-0 font-bold text-muted-foreground",
          size === "sm" ? "text-[10px]" : "text-xs",
        )}
      >
        {label}
        <span className="ml-1 text-foreground">{percent}%</span>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        disabled={disabled}
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={(e) => {
          e.stopPropagation();
          onCommit?.(Number((e.target as HTMLInputElement).value));
        }}
        onKeyUp={(e) => {
          if (e.key === "Enter" || e.key === " ") return;
          onCommit?.(Number((e.target as HTMLInputElement).value));
        }}
        className={cn(
          "min-w-0 flex-1 accent-[var(--hub-coral)] disabled:opacity-50",
          size === "sm" ? "h-1.5" : "h-2",
        )}
      />
    </div>
  );
}
