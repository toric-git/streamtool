import { describe, expect, it } from "vitest";
import {
  getPermissionsForRole,
  canUserPlay,
  canUserUpload,
} from "@/lib/permissions/room-permissions";

describe("room permissions", () => {
  it("gives owner full control", () => {
    const p = getPermissionsForRole("owner");
    expect(p.canDeleteRoom).toBe(true);
    expect(p.canManageObsToken).toBe(true);
    expect(p.canStopAll).toBe(true);
  });

  it("prevents admin from deleting room or rotating OBS token", () => {
    const p = getPermissionsForRole("admin");
    expect(p.canManageSounds).toBe(true);
    expect(p.canDeleteRoom).toBe(false);
    expect(p.canManageObsToken).toBe(false);
    expect(p.canAssignAdmin).toBe(false);
  });

  it("denies guest play unless guestCanPlay", () => {
    expect(
      canUserPlay({
        role: "guest",
        canPlayFlag: true,
        isMuted: false,
        guestCanPlay: false,
      }),
    ).toBe(false);
    expect(
      canUserPlay({
        role: "guest",
        canPlayFlag: true,
        isMuted: false,
        guestCanPlay: true,
      }),
    ).toBe(true);
  });

  it("blocks muted members", () => {
    expect(
      canUserPlay({
        role: "member",
        canPlayFlag: true,
        isMuted: true,
        guestCanPlay: true,
      }),
    ).toBe(false);
  });

  it("requires upload flags for members", () => {
    expect(
      canUserUpload({
        role: "member",
        canUploadFlag: false,
        uploadEnabled: true,
      }),
    ).toBe(false);
    expect(
      canUserUpload({
        role: "member",
        canUploadFlag: true,
        uploadEnabled: true,
      }),
    ).toBe(true);
    expect(
      canUserUpload({
        role: "admin",
        canUploadFlag: false,
        uploadEnabled: false,
      }),
    ).toBe(true);
    expect(
      canUserUpload({
        role: "owner",
        canUploadFlag: false,
        uploadEnabled: false,
      }),
    ).toBe(true);
  });
});
