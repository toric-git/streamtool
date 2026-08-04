import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFavoriteSounds } from "@/hooks/use-favorite-sounds";

describe("useFavoriteSounds", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("toggles and persists favorites per room", () => {
    const { result } = renderHook(() => useFavoriteSounds("room-a"));
    act(() => {
      result.current.toggleFavorite("sound-1");
    });
    expect(result.current.isFavorite("sound-1")).toBe(true);
    expect(JSON.parse(localStorage.getItem("rsb:favorites:room-a") ?? "[]")).toEqual([
      "sound-1",
    ]);

    act(() => {
      result.current.toggleFavorite("sound-1");
    });
    expect(result.current.isFavorite("sound-1")).toBe(false);
  });
});
