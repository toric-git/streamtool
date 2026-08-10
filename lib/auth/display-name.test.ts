import { describe, expect, it } from "vitest";
import {
  getChosenDisplayName,
  needsDisplayNameSetup,
} from "@/lib/auth/display-name";

describe("display-name helpers", () => {
  it("reads only user-chosen display_name metadata", () => {
    expect(
      getChosenDisplayName({
        user_metadata: { display_name: "配信太郎", full_name: "Google Name" },
      }),
    ).toBe("配信太郎");
    expect(
      getChosenDisplayName({
        user_metadata: { full_name: "Google Name", name: "Google Name" },
      }),
    ).toBeNull();
  });

  it("requires setup when Google login has no chosen display_name", () => {
    expect(
      needsDisplayNameSetup({
        user_metadata: { full_name: "Google Name" },
      }),
    ).toBe(true);
    expect(
      needsDisplayNameSetup({
        user_metadata: { display_name: "配信太郎" },
      }),
    ).toBe(false);
    expect(
      needsDisplayNameSetup({
        is_anonymous: true,
        user_metadata: {},
      }),
    ).toBe(false);
  });
});
