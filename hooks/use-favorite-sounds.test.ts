import { describe, expect, it, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

vi.mock("@/app/actions/favorites", () => ({
  listFavoriteSoundIds: vi.fn(async () => ({
    ok: true as const,
    data: { soundIds: [] as string[] },
  })),
  toggleFavoriteSound: vi.fn(async () => ({
    ok: true as const,
    data: { favorite: true },
  })),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => ({
      on() {
        return this;
      },
      subscribe() {
        return this;
      },
    }),
    removeChannel: vi.fn(async () => undefined),
  }),
}));

import { useFavoriteSounds } from "@/hooks/use-favorite-sounds";

describe("useFavoriteSounds", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("toggles and caches favorites per room", async () => {
    const { result } = renderHook(() => useFavoriteSounds("room-a"));
    await waitFor(() => {
      expect(result.current.isFavorite("sound-1")).toBe(false);
    });

    act(() => {
      result.current.toggleFavorite("sound-1");
    });
    expect(result.current.isFavorite("sound-1")).toBe(true);
    expect(
      JSON.parse(localStorage.getItem("rsb:favorites:room-a") ?? "[]"),
    ).toEqual(["sound-1"]);

    act(() => {
      result.current.toggleFavorite("sound-1");
    });
    expect(result.current.isFavorite("sound-1")).toBe(false);
  });
});
