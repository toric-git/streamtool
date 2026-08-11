import { randomInt } from "crypto";
import { ROOM_LIMITS } from "@/lib/app-config";

export { mapRoomJoinError } from "@/lib/errors/messages";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(length = ROOM_LIMITS.roomCodeLength): string {
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return result;
}

export function buildInviteUrl(appUrl: string, roomCode: string): string {
  return `${appUrl.replace(/\/$/, "")}/join/${roomCode}`;
}
