import { describe, expect, it } from "vitest";
import {
  assignHotkeyBinding,
  clearHotkeyBinding,
  effectiveHotkey,
  findSoundIndexByHotkey,
} from "@/lib/sounds/pad-keybinds";

describe("pad-keybinds", () => {
  const sounds = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("uses default index hotkeys when unbound", () => {
    expect(effectiveHotkey("a", 0, {})).toBe("1");
    expect(effectiveHotkey("b", 1, {})).toBe("2");
    expect(findSoundIndexByHotkey("2", sounds, {})).toBe(1);
  });

  it("prefers explicit bindings and steals on assign", () => {
    const bindings = assignHotkeyBinding({}, "c", "1");
    expect(effectiveHotkey("c", 2, bindings)).toBe("1");
    expect(effectiveHotkey("a", 0, bindings)).toBeNull();
    expect(findSoundIndexByHotkey("1", sounds, bindings)).toBe(2);

    const stolen = assignHotkeyBinding(bindings, "a", "1");
    expect(stolen.c).toBeUndefined();
    expect(stolen.a).toBe("1");
    expect(effectiveHotkey("a", 0, stolen)).toBe("1");
  });

  it("clears override back to default", () => {
    const bindings = assignHotkeyBinding({}, "b", "Q");
    expect(clearHotkeyBinding(bindings, "b")).toEqual({});
  });
});
