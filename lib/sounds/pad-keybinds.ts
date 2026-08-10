import {
  hotkeyForIndex,
  indexForHotkey,
  type PadHotkey,
} from "@/lib/sounds/pad-hotkeys";

export type PadKeybindState = {
  /** When false, keyboard shortcuts do not trigger pads. */
  enabled: boolean;
  /** Per-sound overrides. Missing id → default by board index. */
  bindings: Record<string, PadHotkey>;
};

const DEFAULT_STATE: PadKeybindState = {
  enabled: true,
  bindings: {},
};

export function padKeybindsStorageKey(roomId: string): string {
  return `streamtool:pad-keybinds:v1:${roomId}`;
}

export function loadPadKeybinds(roomId: string): PadKeybindState {
  if (typeof window === "undefined") return { ...DEFAULT_STATE, bindings: {} };
  try {
    const raw = window.localStorage.getItem(padKeybindsStorageKey(roomId));
    if (!raw) return { ...DEFAULT_STATE, bindings: {} };
    const parsed = JSON.parse(raw) as Partial<PadKeybindState>;
    return {
      enabled: parsed.enabled !== false,
      bindings:
        parsed.bindings && typeof parsed.bindings === "object"
          ? (parsed.bindings as Record<string, PadHotkey>)
          : {},
    };
  } catch {
    return { ...DEFAULT_STATE, bindings: {} };
  }
}

export function savePadKeybinds(roomId: string, state: PadKeybindState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      padKeybindsStorageKey(roomId),
      JSON.stringify(state),
    );
  } catch {
    /* ignore quota */
  }
}

export function effectiveHotkey(
  soundId: string,
  index: number,
  bindings: Record<string, PadHotkey>,
): PadHotkey | null {
  const override = bindings[soundId];
  if (override) return override;

  const def = hotkeyForIndex(index);
  if (!def) return null;

  // Another pad stole this default key via an override.
  for (const [id, key] of Object.entries(bindings)) {
    if (id !== soundId && key === def) return null;
  }
  return def;
}

/** Resolve which board index a pressed hotkey should trigger. */
export function findSoundIndexByHotkey(
  hotkey: PadHotkey,
  sounds: readonly { id: string }[],
  bindings: Record<string, PadHotkey>,
): number {
  for (let i = 0; i < sounds.length; i++) {
    const sound = sounds[i];
    if (sound && bindings[sound.id] === hotkey) return i;
  }

  const defaultIndex = indexForHotkey(hotkey);
  if (defaultIndex < 0 || defaultIndex >= sounds.length) return -1;
  const sound = sounds[defaultIndex];
  if (!sound) return -1;
  if (bindings[sound.id]) return -1;

  for (const [id, key] of Object.entries(bindings)) {
    if (id !== sound.id && key === hotkey) return -1;
  }
  return defaultIndex;
}

/** Assign hotkey to a sound; steals the key from any other sound override. */
export function assignHotkeyBinding(
  bindings: Record<string, PadHotkey>,
  soundId: string,
  hotkey: PadHotkey,
): Record<string, PadHotkey> {
  const next: Record<string, PadHotkey> = {};
  for (const [id, key] of Object.entries(bindings)) {
    if (id === soundId || key === hotkey) continue;
    next[id] = key;
  }
  next[soundId] = hotkey;
  return next;
}

export function clearHotkeyBinding(
  bindings: Record<string, PadHotkey>,
  soundId: string,
): Record<string, PadHotkey> {
  if (!(soundId in bindings)) return bindings;
  const next = { ...bindings };
  delete next[soundId];
  return next;
}
