export const OBS_DISPLAY_NAME = "OBS";

export function isObsMember(member: {
  display_name: string;
  role?: string;
  can_play?: boolean;
  is_muted?: boolean;
}): boolean {
  return (
    member.display_name === OBS_DISPLAY_NAME &&
    (member.role === "guest" || member.role === undefined) &&
    member.can_play === false
  );
}

export function filterHumanMembers<T extends {
  display_name: string;
  role?: string;
  can_play?: boolean;
  is_muted?: boolean;
}>(members: T[]): T[] {
  return members.filter((m) => !isObsMember(m));
}

export function canManageTarget(options: {
  actorRole: string;
  targetRole: string;
  targetUserId: string;
  actorUserId: string;
}): boolean {
  const { actorRole, targetRole, targetUserId, actorUserId } = options;
  if (targetUserId === actorUserId) return false;
  if (targetRole === "owner") return false;
  if (actorRole === "owner") return true;
  if (actorRole === "admin") return targetRole === "member" || targetRole === "guest";
  return false;
}
