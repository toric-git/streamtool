import { describe, expect, it } from "vitest";
import {
  generateObsTokenPlain,
  hashObsToken,
  verifyObsToken,
  obsTokenHint,
} from "@/lib/obs/token";

describe("obs token", () => {
  const pepper = "test-pepper-value";

  it("hashes and verifies tokens", () => {
    const plain = generateObsTokenPlain();
    const hash = hashObsToken(plain, pepper);
    expect(verifyObsToken(plain, hash, pepper)).toBe(true);
    expect(verifyObsToken(plain + "x", hash, pepper)).toBe(false);
    expect(obsTokenHint(plain)).toBe(plain.slice(-4));
  });

  it("does not store plaintext equality", () => {
    const plain = "super-secret-token-value";
    const hash = hashObsToken(plain, pepper);
    expect(hash).not.toContain(plain);
    expect(hash).toHaveLength(64);
  });
});
