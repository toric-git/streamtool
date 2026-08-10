import { describe, expect, it } from "vitest";
import {
  hotkeyForIndex,
  indexForHotkey,
  matchPadHotkey,
  PAD_HOTKEYS,
} from "@/lib/sounds/pad-hotkeys";

describe("pad-hotkeys", () => {
  it("maps first nine to pondashi layout", () => {
    expect(PAD_HOTKEYS.slice(0, 9)).toEqual([
      "1",
      "2",
      "3",
      "Q",
      "W",
      "E",
      "A",
      "S",
      "D",
    ]);
  });

  it("resolves index and hotkey both ways", () => {
    expect(hotkeyForIndex(0)).toBe("1");
    expect(hotkeyForIndex(4)).toBe("W");
    expect(indexForHotkey("d")).toBe(8);
    expect(hotkeyForIndex(99)).toBeNull();
  });

  it("matches keyboard codes without modifiers", () => {
    expect(
      matchPadHotkey({ code: "KeyQ", metaKey: false, ctrlKey: false, altKey: false } as KeyboardEvent),
    ).toBe("Q");
    expect(
      matchPadHotkey({ code: "KeyQ", metaKey: true, ctrlKey: false, altKey: false } as KeyboardEvent),
    ).toBeNull();
  });
});
