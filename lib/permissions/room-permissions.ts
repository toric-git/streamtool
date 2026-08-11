import type { RoomRole } from "@/types/database";

export type RoomPermissions = {
  canViewRoom: boolean;
  canPlay: boolean;
  canUpload: boolean;
  canManageSounds: boolean;
  canApproveSounds: boolean;
  canManageMembers: boolean;
  canAssignAdmin: boolean;
  canKick: boolean;
  canMutePlay: boolean;
  canEditRoom: boolean;
  canDeleteRoom: boolean;
  canStopAll: boolean;
  canReorderSounds: boolean;
};

const DENY_ALL: RoomPermissions = {
  canViewRoom: false,
  canPlay: false,
  canUpload: false,
  canManageSounds: false,
  canApproveSounds: false,
  canManageMembers: false,
  canAssignAdmin: false,
  canKick: false,
  canMutePlay: false,
  canEditRoom: false,
  canDeleteRoom: false,
  canStopAll: false,
  canReorderSounds: false,
};

export function getPermissionsForRole(role: RoomRole | null | undefined): RoomPermissions {
  if (!role) return DENY_ALL;

  switch (role) {
    case "owner":
      return {
        canViewRoom: true,
        canPlay: true,
        canUpload: true,
        canManageSounds: true,
        canApproveSounds: true,
        canManageMembers: true,
        canAssignAdmin: true,
        canKick: true,
        canMutePlay: true,
        canEditRoom: true,
        canDeleteRoom: true,
        canStopAll: true,
        canReorderSounds: true,
      };
    case "admin":
      return {
        canViewRoom: true,
        canPlay: true,
        canUpload: true,
        canManageSounds: true,
        canApproveSounds: true,
        canManageMembers: false,
        canAssignAdmin: false,
        canKick: false,
        canMutePlay: true,
        canEditRoom: false,
        canDeleteRoom: false,
        canStopAll: true,
        canReorderSounds: true,
      };
    case "member":
      return {
        ...DENY_ALL,
        canViewRoom: true,
        canPlay: true,
        canUpload: false,
      };
    case "guest":
      return {
        ...DENY_ALL,
        canViewRoom: true,
        canPlay: false,
        canUpload: false,
      };
    default:
      return DENY_ALL;
  }
}

export function isOwnerOrAdmin(role: RoomRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function canUserPlay(options: {
  role: RoomRole | null | undefined;
  canPlayFlag: boolean;
  isMuted: boolean;
  guestCanPlay: boolean;
}): boolean {
  const { role, canPlayFlag, isMuted, guestCanPlay } = options;
  if (!role || isMuted || !canPlayFlag) return false;
  if (role === "guest") return guestCanPlay;
  return getPermissionsForRole(role).canPlay || role === "member";
}

export function canUserUpload(options: {
  role: RoomRole | null | undefined;
  canUploadFlag: boolean;
  uploadEnabled: boolean;
}): boolean {
  const { role, canUploadFlag, uploadEnabled } = options;
  if (!role) return false;
  // Owners/admins always manage the board (room flag is for members).
  if (role === "owner" || role === "admin") return true;
  if (!uploadEnabled) return false;
  return canUploadFlag;
}
