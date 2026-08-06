import { describe, expect, it } from "vitest";
import { E } from "@/lib/errors/catalog";
import {
  mapAuthError,
  mapMemberError,
  mapPlaybackError,
  mapRoomJoinError,
  mapRoomPageError,
} from "@/lib/errors/messages";

describe("error messages", () => {
  it("maps auth errors with stable codes", () => {
    expect(mapAuthError("Invalid login credentials")).toEqual(
      E.AUTH_INVALID_CREDENTIALS,
    );
    expect(mapAuthError("AuthRetryableFetchError fetch failed").code).toBe(
      "E1008",
    );
    expect(mapAuthError("provider is not enabled")).toEqual(
      E.AUTH_PROVIDER_DISABLED,
    );
  });

  it("maps join errors with stable codes", () => {
    expect(mapRoomJoinError("room is full")).toEqual(E.ROOM_JOIN_FULL);
    expect(mapRoomJoinError("guest join disabled")).toEqual(
      E.ROOM_JOIN_GUEST_DISABLED,
    );
  });

  it("maps member errors with stable codes", () => {
    expect(mapMemberError("permission denied")).toEqual(E.MEMBER_PERMISSION);
  });

  it("maps playback errors with stable codes", () => {
    expect(mapPlaybackError("cooldown active")).toEqual(E.PLAY_COOLDOWN);
  });

  it("maps room page query errors with stable codes", () => {
    expect(mapRoomPageError("owner_leave")).toEqual(E.ROOM_OWNER_LEAVE);
    expect(mapRoomPageError(undefined)).toBeNull();
  });
});
