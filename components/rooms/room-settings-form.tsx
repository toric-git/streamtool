"use client";

import { useState, useTransition } from "react";
import { deleteRoom, updateRoom } from "@/app/actions/rooms";
import { Alert } from "@/components/ui/alert";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { E, type AppError } from "@/lib/errors/catalog";
import type { Tables } from "@/types/database";

export function RoomSettingsForm({
  room,
  role,
}: {
  room: Pick<
    Tables<"rooms">,
    | "id"
    | "name"
    | "description"
    | "guest_enabled"
    | "guest_can_play"
    | "upload_enabled"
    | "upload_requires_approval"
    | "master_volume"
    | "obs_volume"
    | "default_cooldown_ms"
    | "max_events_per_minute"
    | "max_simultaneous_sounds"
    | "max_members"
  > & { has_password: boolean };
  role: string;
}) {
  const [error, setError] = useState<AppError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const canEdit = role === "owner" || role === "admin";
  const isOwner = role === "owner";

  if (!canEdit) {
    return <ErrorAlert error={E.ROOM_UPDATE_FORBIDDEN} />;
  }

  return (
    <div className="space-y-8">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          setError(null);
          setSuccess(null);
          startTransition(async () => {
            const result = await updateRoom(room.id, formData);
            if (!result.ok) {
              setError({ code: result.code, message: result.error });
            } else {
              setSuccess("設定を保存しました。");
            }
          });
        }}
      >
        {error && <ErrorAlert error={error} />}
        {success && <Alert>{success}</Alert>}

        <div className="space-y-2">
          <Label htmlFor="name">部屋名</Label>
          <Input id="name" name="name" required defaultValue={room.name} maxLength={60} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">説明</Label>
          <Input
            id="description"
            name="description"
            defaultValue={room.description ?? ""}
            maxLength={500}
          />
        </div>

        {isOwner && (
          <fieldset className="space-y-3 rounded-lg border p-4">
            <legend className="px-1 text-sm font-medium">参加パスワード</legend>
            <p className="text-xs text-muted-foreground">
              現在: {room.has_password ? "設定済み" : "未設定"}（平文は保存されません）
            </p>
            <div className="space-y-2">
              <Label htmlFor="password">新しいパスワード</Label>
              <Input id="password" name="password" type="password" minLength={4} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="clearPassword" className="size-4" />
              パスワードを削除する
            </label>
          </fieldset>
        )}

        <fieldset className="space-y-3 rounded-lg border p-4">
          <legend className="px-1 text-sm font-medium">権限・制限</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="guestEnabled"
              defaultChecked={room.guest_enabled}
              className="size-4"
            />
            ゲスト参加を許可
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="guestCanPlay"
              defaultChecked={room.guest_can_play}
              className="size-4"
            />
            ゲストの再生を許可
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="uploadEnabled"
              defaultChecked={room.upload_enabled}
              className="size-4"
            />
            アップロードを許可
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="masterVolume">部屋音量 (0-1)</Label>
              <Input
                id="masterVolume"
                name="masterVolume"
                type="number"
                step="0.05"
                min={0}
                max={1}
                defaultValue={Number(room.master_volume)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obsVolume">OBS音量 (0-1)</Label>
              <Input
                id="obsVolume"
                name="obsVolume"
                type="number"
                step="0.05"
                min={0}
                max={1}
                defaultValue={Number(room.obs_volume)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultCooldownMs">デフォルトクールダウン (ms)</Label>
              <Input
                id="defaultCooldownMs"
                name="defaultCooldownMs"
                type="number"
                min={1000}
                step={100}
                defaultValue={room.default_cooldown_ms}
              />
              <p className="text-xs text-muted-foreground">
                連打防止のため 1000ms 以上にしてください
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxEventsPerMinute">1分あたり最大イベント</Label>
              <Input
                id="maxEventsPerMinute"
                name="maxEventsPerMinute"
                type="number"
                min={1}
                defaultValue={room.max_events_per_minute}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxSimultaneousSounds">同時再生上限</Label>
              <Input
                id="maxSimultaneousSounds"
                name="maxSimultaneousSounds"
                type="number"
                min={1}
                defaultValue={room.max_simultaneous_sounds}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxMembers">最大人数</Label>
              <Input
                id="maxMembers"
                name="maxMembers"
                type="number"
                min={2}
                defaultValue={room.max_members}
              />
            </div>
          </div>
        </fieldset>

        <Button type="submit" disabled={pending}>
          {pending ? "保存中…" : "設定を保存"}
        </Button>
      </form>

      {isOwner && (
        <form
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!window.confirm("本当にこの部屋を削除しますか？この操作は取り消せません。")) {
              return;
            }
            setError(null);
            startTransition(async () => {
              const result = await deleteRoom(room.id);
              if (result && "ok" in result && !result.ok) {
                setError({ code: result.code, message: result.error });
              }
            });
          }}
        >
          <h3 className="font-semibold text-destructive">危険な操作</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            部屋・サウンド・履歴が削除されます。Storage 上の孤立ファイルは手動クリーンアップが必要な場合があります。
          </p>
          <Button type="submit" variant="destructive" className="mt-3" disabled={pending}>
            部屋を削除
          </Button>
        </form>
      )}
    </div>
  );
}
