"use client";

import { useState, useTransition } from "react";
import { createRoom } from "@/app/actions/rooms";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppError } from "@/lib/errors/catalog";

export function CreateRoomForm() {
  const [error, setError] = useState<AppError | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,rgba(255,77,141,0.18),transparent_55%),rgba(255,247,251,0.88)] p-6 backdrop-blur-sm">
          <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border border-border bg-white/95 p-8 text-center shadow-lg">
            <div
              className="size-10 animate-spin rounded-full border-[3px] border-[var(--hub-coral)]/25 border-t-[var(--hub-coral)]"
              aria-hidden
            />
            <p className="font-display text-xl font-semibold tracking-tight">
              部屋を作成しています…
            </p>
            <p className="text-sm font-semibold text-muted-foreground">
              作成が終わるとぽんだしパッドへ移動します
            </p>
          </div>
        </div>
      )}

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          setError(null);
          startTransition(async () => {
            const result = await createRoom(formData);
            if (result && "ok" in result && !result.ok) {
              setError({ code: result.code, message: result.error });
            }
          });
        }}
      >
        {error && <ErrorAlert error={error} />}

        <div className="space-y-2">
          <Label htmlFor="name">部屋名</Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={60}
            placeholder="配信サウンドボード"
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">説明（任意）</Label>
          <Input
            id="description"
            name="description"
            maxLength={500}
            placeholder="用途など"
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">参加パスワード（任意）</Label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={4}
            autoComplete="new-password"
            placeholder="未設定なら誰でもコードで参加可"
            disabled={pending}
          />
        </div>

        <fieldset className="space-y-3 rounded-lg border p-4" disabled={pending}>
          <legend className="px-1 text-sm font-medium">参加・投稿設定</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="guestEnabled"
              defaultChecked
              className="size-4"
            />
            ゲスト（匿名）参加を許可
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="guestCanPlay"
              defaultChecked
              className="size-4"
            />
            ゲストの再生を許可
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="uploadEnabled" className="size-4" />
            メンバーの音声アップロードを許可
          </label>
        </fieldset>

        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "作成中…" : "部屋を作成"}
        </Button>
      </form>
    </>
  );
}
