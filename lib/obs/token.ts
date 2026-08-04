import { createHash, randomBytes } from "crypto";

function getPepper(): string {
  const pepper = process.env.OBS_TOKEN_PEPPER;
  if (!pepper) {
    throw new Error("OBS_TOKEN_PEPPER is not configured");
  }
  return pepper;
}

export function generateObsTokenPlain(): string {
  return randomBytes(32).toString("base64url");
}

export function hashObsToken(plainToken: string, pepper = getPepper()): string {
  return createHash("sha256").update(`${pepper}:${plainToken}`).digest("hex");
}

export function obsTokenHint(plainToken: string): string {
  if (plainToken.length <= 4) return plainToken;
  return plainToken.slice(-4);
}

export function verifyObsToken(
  plainToken: string,
  tokenHash: string,
  pepper = getPepper(),
): boolean {
  const computed = hashObsToken(plainToken, pepper);
  if (computed.length !== tokenHash.length) return false;

  // timing-safe compare
  let mismatch = 0;
  for (let i = 0; i < computed.length; i += 1) {
    mismatch |= computed.charCodeAt(i) ^ tokenHash.charCodeAt(i);
  }
  return mismatch === 0;
}
