"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  kickMember,
  setMemberPlayPermission,
  setMemberRole,
  setMemberUploadPermission,
  transferOwnership,
} from "@/app/actions/members";
import { canManageTarget, filterHumanMembers, isObsMember } from "@/lib/rooms/members";
import { getPermissionsForRole } from "@/lib/permissions/room-permissions";
import { Alert } from "@/components/ui/alert";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Button } from "@/components/ui/button";
import type { AppError, ErrorCode } from "@/lib/errors/catalog";
import type { RoomRole } from "@/types/database";

export type ManageableMember = {
  user_id: string;
  display_name: string;
  role: RoomRole;
  can_play: boolean;
  can_upload: boolean;
  is_muted: boolean;
  joined_at: string;
};

const ROLE_LABEL: Record<string, string> = {
  owner: "オーナー",
  admin: "管理者",
  member: "メンバー",
  guest: "ゲスト",
};

export function MemberManageList({
  roomId,
  actorUserId,
  actorRole,
  members,
  compact = false,
}: {
  roomId: string;
  actorUserId: string;
  actorRole: RoomRole;
  members: ManageableMember[];
  /** Narrow sidebar layout for the room board. */
  compact?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<AppError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const permissions = getPermissionsForRole(actorRole);
  const visible = filterHumanMembers(members);
  const obsCount = members.filter(isObsMember).length;
  const showAdvanced = !compact;

  function run(
    action: () => Promise<
      { ok: true } | { ok: false; error: string; code: ErrorCode }
    >,
    okMsg: string,
  ) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError({ code: result.code, message: result.error });
        return;
      }
      setSuccess(okMsg);
      router.refresh();
    });
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      {error && <ErrorAlert error={error} />}
      {success && <Alert>{success}</Alert>}
      {!compact && obsCount > 0 && (
        <p className="text-xs text-muted-foreground">
          OBS 接続用セッション {obsCount} 件は一覧から除外しています。
        </p>
      )}

      <ul className={compact ? "space-y-2" : "divide-y rounded-xl border bg-card"}>
        {visible.map((m) => {
          const manageable = canManageTarget({
            actorRole,
            targetRole: m.role,
            targetUserId: m.user_id,
            actorUserId,
          });
          const isSelf = m.user_id === actorUserId;

          return (
            <li
              key={m.user_id}
              className={
                compact
                  ? "space-y-2 rounded-xl border bg-background/80 px-3 py-3"
                  : "space-y-3 px-4 py-4"
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {m.display_name}
                    {isSelf ? "（あなた）" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABEL[m.role] ?? m.role}
                    {!compact && (
                      <> · {new Date(m.joined_at).toLocaleString("ja-JP")}</>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    再生: {m.can_play && !m.is_muted ? "可" : "不可"}
                    {m.is_muted ? "（ミュート）" : ""}
                    {showAdvanced && (
                      <> · アップロード: {m.can_upload ? "可" : "不可"}</>
                    )}
                  </p>
                </div>
              </div>

              {manageable && (
                <div className="flex flex-wrap gap-1.5">
                  {permissions.canMutePlay && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          run(
                            () =>
                              setMemberPlayPermission(
                                roomId,
                                m.user_id,
                                false,
                                true,
                              ),
                            `${m.display_name} の再生を禁止しました。`,
                          )
                        }
                      >
                        再生禁止
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          run(
                            () =>
                              setMemberPlayPermission(
                                roomId,
                                m.user_id,
                                true,
                                false,
                              ),
                            `${m.display_name} の再生を許可しました。`,
                          )
                        }
                      >
                        再生許可
                      </Button>
                    </>
                  )}

                  {showAdvanced && permissions.canManageSounds && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        run(
                          () =>
                            setMemberUploadPermission(
                              roomId,
                              m.user_id,
                              !m.can_upload,
                            ),
                          `${m.display_name} のアップロードを${m.can_upload ? "禁止" : "許可"}しました。`,
                        )
                      }
                    >
                      {m.can_upload ? "アップロード禁止" : "アップロード許可"}
                    </Button>
                  )}

                  {showAdvanced &&
                    permissions.canAssignAdmin &&
                    m.role !== "admin" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={pending}
                        onClick={() => {
                          if (
                            !window.confirm(
                              `${m.display_name} を管理者にしますか？`,
                            )
                          ) {
                            return;
                          }
                          run(
                            () => setMemberRole(roomId, m.user_id, "admin"),
                            `${m.display_name} を管理者にしました。`,
                          );
                        }}
                      >
                        管理者に任命
                      </Button>
                    )}

                  {showAdvanced &&
                    permissions.canAssignAdmin &&
                    m.role === "admin" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={pending}
                        onClick={() => {
                          if (
                            !window.confirm(
                              `${m.display_name} をメンバーに戻しますか？`,
                            )
                          ) {
                            return;
                          }
                          run(
                            () => setMemberRole(roomId, m.user_id, "member"),
                            `${m.display_name} をメンバーに戻しました。`,
                          );
                        }}
                      >
                        管理者を解除
                      </Button>
                    )}

                  {showAdvanced &&
                    actorRole === "owner" &&
                    (m.role === "admin" || m.role === "member") && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={pending}
                        onClick={() => {
                          if (
                            !window.confirm(
                              `${m.display_name} にオーナー権限を移譲しますか？\nあなたは管理者になります。`,
                            )
                          ) {
                            return;
                          }
                          run(
                            () => transferOwnership(roomId, m.user_id),
                            `${m.display_name} に所有権を移譲しました。`,
                          );
                        }}
                      >
                        オーナーに移譲
                      </Button>
                    )}

                  {permissions.canKick && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={pending}
                      onClick={() => {
                        if (
                          !window.confirm(
                            `${m.display_name} を部屋からキックしますか？`,
                          )
                        ) {
                          return;
                        }
                        run(
                          () => kickMember(roomId, m.user_id),
                          `${m.display_name} をキックしました。`,
                        );
                      }}
                    >
                      キック
                    </Button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
