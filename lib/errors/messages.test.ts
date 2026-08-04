import { describe, expect, it } from "vitest";
import {
  mapAuthError,
  mapMemberError,
  mapPlaybackError,
  mapRoomJoinError,
  mapRoomPageError,
} from "@/lib/errors/messages";

describe("error messages", () => {
  it("maps auth errors", () => {
    expect(mapAuthError("Invalid login credentials")).toContain("パスワード");
  });

  it("maps join errors", () => {
    expect(mapRoomJoinError("room is full")).toContain("満員");
    expect(mapRoomJoinError("guest join disabled")).toContain("ゲスト");
  });

  it("maps member errors", () => {
    expect(mapMemberError("permission denied")).toContain("権限");
  });

  it("maps playback errors", () => {
    expect(mapPlaybackError("cooldown active")).toContain("クールダウン");
  });

  it("maps room page query errors", () => {
    expect(mapRoomPageError("owner_leave")).toContain("オーナー");
    expect(mapRoomPageError(undefined)).toBeNull();
  });
});
