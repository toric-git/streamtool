import { describe, expect, it } from "vitest";
import {
  FREE_MAX_MEMBERS,
  hasPaidRoomCapacity,
  maxMembersCap,
  requiresPaidCapacity,
} from "@/lib/billing/capacity";

describe("room capacity billing", () => {
  it("treats 8+ as paid", () => {
    expect(requiresPaidCapacity(FREE_MAX_MEMBERS)).toBe(false);
    expect(requiresPaidCapacity(8)).toBe(true);
  });

  it("caps free users at 7", () => {
    expect(maxMembersCap(false)).toBe(7);
    expect(maxMembersCap(true)).toBe(200);
  });

  it("checks paid allowlist emails", () => {
    const prev = process.env.PAID_CAPACITY_EMAILS;
    process.env.PAID_CAPACITY_EMAILS = "pro@example.com, Other@Example.com";
    expect(hasPaidRoomCapacity("pro@example.com")).toBe(true);
    expect(hasPaidRoomCapacity("other@example.com")).toBe(true);
    expect(hasPaidRoomCapacity("free@example.com")).toBe(false);
    process.env.PAID_CAPACITY_EMAILS = prev;
  });
});
