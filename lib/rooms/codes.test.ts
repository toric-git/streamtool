import { describe, expect, it } from "vitest";
import { buildInviteUrl, generateRoomCode, mapRoomJoinError } from "@/lib/rooms/codes";

describe("room codes", () => {
  it("generates 8-char codes without ambiguous characters", () => {
    const code = generateRoomCode();
    expect(code).toMatch(/^[A-Z0-9]{8}$/);
    expect(code).not.toMatch(/[IO01]/);
  });

  it("builds invite urls", () => {
    expect(buildInviteUrl("http://localhost:3000/", "ABC12345")).toBe(
      "http://localhost:3000/join/ABC12345",
    );
  });

  it("maps join errors to Japanese guidance", () => {
    expect(mapRoomJoinError("room is full")).toContain("満員");
    expect(mapRoomJoinError("guest join disabled")).toContain("ゲスト");
  });
});
