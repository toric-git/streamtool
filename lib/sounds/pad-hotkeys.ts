/**
 * Pondashi-style pad hotkeys (left-to-right, top-to-bottom).
 * Matches common 3x3 layouts: 1 2 3 / Q W E / A S D
 */
export const PAD_HOTKEYS = [
  "1",
  "2",
  "3",
  "Q",
  "W",
  "E",
  "A",
  "S",
  "D",
  "4",
  "5",
  "6",
  "R",
  "T",
  "Y",
  "F",
  "G",
  "H",
  "7",
  "8",
  "9",
  "Z",
  "X",
  "C",
] as const;

export type PadHotkey = (typeof PAD_HOTKEYS)[number];

export function hotkeyForIndex(index: number): PadHotkey | null {
  return PAD_HOTKEYS[index] ?? null;
}

/** Map KeyboardEvent.code / key to pad hotkey label. */
export function matchPadHotkey(event: KeyboardEvent): PadHotkey | null {
  if (event.metaKey || event.ctrlKey || event.altKey) return null;

  const codeMap: Record<string, PadHotkey> = {
    Digit1: "1",
    Digit2: "2",
    Digit3: "3",
    Digit4: "4",
    Digit5: "5",
    Digit6: "6",
    Digit7: "7",
    Digit8: "8",
    Digit9: "9",
    KeyQ: "Q",
    KeyW: "W",
    KeyE: "E",
    KeyR: "R",
    KeyT: "T",
    KeyY: "Y",
    KeyA: "A",
    KeyS: "S",
    KeyD: "D",
    KeyF: "F",
    KeyG: "G",
    KeyH: "H",
    KeyZ: "Z",
    KeyX: "X",
    KeyC: "C",
  };

  return codeMap[event.code] ?? null;
}

export function indexForHotkey(hotkey: string): number {
  return PAD_HOTKEYS.indexOf(hotkey.toUpperCase() as PadHotkey);
}
