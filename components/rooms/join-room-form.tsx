"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { joinRoomAction } from "@/app/actions/rooms";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { E, type AppError } from "@/lib/errors/catalog";

type JoinInfo = {
  name: string;
  has_password: boolean;
  guest_enabled: boolean;
  member_count: number;
  max_members: number;
};

export function JoinRoomForm({
  roomCode,
  info,
  isAuthenticated,
  isAnonymous,
  suggestedDisplayName = "",
}: {
  roomCode: string;
  info: JoinInfo | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  suggestedDisplayName?: string;
}) {
  const [error, setError] = useState<AppError | null>(null);
  const [pending, startTransition] = useTransition();

  if (!info) {
    return (
      <div className="space-y-4">
        <ErrorAlert
          error={{
            ...E.ROOM_JOIN_INVALID_CODE,
            message:
              "招待コードが無効か、部屋が削除されています。コードを確認してください。",
          }}
        />
        <Button asChild variant="outline">
          <Link href="/">トップへ戻る</Link>
        </Button>
      </div>
    );
  }

  const canGuest = info.guest_enabled;
  const full = info.member_count >= info.max_members;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (full) return;
        const formData = new FormData(e.currentTarget);
        formData.set("roomCode", roomCode);
        setError(null);
        startTransition(async () => {
          const result = await joinRoomAction(formData);
          if (result && "ok" in result && !result.ok) {
            setError({ code: result.code, message: result.error });
          }
        });
      }}
    >
      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
        <p className="font-medium text-foreground">{info.name}</p>
        <p className="mt-1 text-muted-foreground">
          参加者 {info.member_count}/{info.max_members}
          {info.has_password ? " · パスワード付き" : ""}
        </p>
      </div>

      {full && <ErrorAlert error={E.ROOM_JOIN_FULL} />}
      {error && <ErrorAlert error={error} />}

      <div className="space-y-2">
        <Label htmlFor="displayName">表示名</Label>
        <Input
          id="displayName"
          name="displayName"
          required
          maxLength={30}
          autoComplete="nickname"
          defaultValue={suggestedDisplayName}
          placeholder="この部屋で使う名前"
        />
        <p className="text-xs text-muted-foreground">
          参加者一覧に出る名前です。Googleアカウント名は使いません。
        </p>
      </div>

      {info.has_password && (
        <div className="space-y-2">
          <Label htmlFor="password">参加パスワード</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
      )}

      {!isAuthenticated && canGuest && (
        <input type="hidden" name="asGuest" value="on" />
      )}

      {!isAuthenticated && !canGuest ? (
        <div className="space-y-3">
          <ErrorAlert error={E.ROOM_JOIN_GUEST_DISABLED} />
          <Button asChild className="w-full">
            <Link href={`/login?next=/join/${roomCode}`}>ログインして参加</Link>
          </Button>
        </div>
      ) : (
        <Button type="submit" className="w-full" disabled={pending || full}>
          {pending ? "参加中…" : "参加して音声を有効にする"}
        </Button>
      )}

      {!isAuthenticated && canGuest && (
        <p className="text-center text-xs text-muted-foreground">
          アカウントがある場合は{" "}
          <Link
            className="underline underline-offset-2"
            href={`/login?next=/join/${roomCode}`}
          >
            ログイン
          </Link>
          してから参加できます。
        </p>
      )}
    </form>
  );
}
