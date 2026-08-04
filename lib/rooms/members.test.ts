import { describe, expect, it } from "vitest";
import {
  canManageTarget,
  filterHumanMembers,
  isObsMember,
} from "@/lib/rooms/members";

describe("member helpers", () => {
  it("detects OBS system members", () => {
    expect(
      isObsMember({
        display_name: "OBS",
        role: "guest",
        can_play: false,
        is_muted: true,
      }),
    ).toBe(true);
    expect(
      isObsMember({
        display_name: "配信者",
        role: "guest",
        can_play: true,
      }),
    ).toBe(false);
  });

  it("filters human members", () => {
    const list = filterHumanMembers([
      { display_name: "Alice", role: "owner", can_play: true },
      { display_name: "OBS", role: "guest", can_play: false, is_muted: true },
    ]);
    expect(list).toHaveLength(1);
    expect(list[0]?.display_name).toBe("Alice");
  });

  it("restricts manage targets by role", () => {
    expect(
      canManageTarget({
        actorRole: "owner",
        targetRole: "admin",
        actorUserId: "a",
        targetUserId: "b",
      }),
    ).toBe(true);
    expect(
      canManageTarget({
        actorRole: "admin",
        targetRole: "admin",
        actorUserId: "a",
        targetUserId: "b",
      }),
    ).toBe(false);
    expect(
      canManageTarget({
        actorRole: "admin",
        targetRole: "member",
        actorUserId: "a",
        targetUserId: "b",
      }),
    ).toBe(true);
    expect(
      canManageTarget({
        actorRole: "owner",
        targetRole: "owner",
        actorUserId: "a",
        targetUserId: "b",
      }),
    ).toBe(false);
  });
});
