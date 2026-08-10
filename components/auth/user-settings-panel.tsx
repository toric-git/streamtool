"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDisplayNameAction } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppError } from "@/lib/errors/catalog";

export function UserSettingsPanel({
  displayName,
  buttonVariant = "outline",
}: {
  displayName: string;
  buttonVariant?: "outline" | "ghost" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const titleId = useId();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        size="sm"
        onClick={() => {
          setError(null);
          setSuccess(null);
          setOpen(true);
        }}
      >
        ユーザー設定
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-6"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
              <div>
                <h2
                  id={titleId}
                  className="font-display text-lg font-semibold tracking-tight"
                >
                  ユーザー設定
                </h2>
                <p className="text-xs font-semibold text-muted-foreground">
                  部屋や参加者一覧に表示される名前を変更できます
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                閉じる
              </Button>
            </div>

            <form
              className="space-y-4 px-4 py-4"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                setError(null);
                setSuccess(null);
                startTransition(async () => {
                  const result = await updateDisplayNameAction(formData);
                  if (result && "ok" in result && !result.ok) {
                    setError({ code: result.code, message: result.error });
                    return;
                  }
                  setSuccess("表示名を保存しました。");
                  router.refresh();
                });
              }}
            >
              {error && <ErrorAlert error={error} />}
              {success && (
                <p className="text-sm font-semibold text-emerald-700">
                  {success}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="user-settings-displayName">表示名</Label>
                <Input
                  id="user-settings-displayName"
                  name="displayName"
                  required
                  maxLength={30}
                  autoComplete="nickname"
                  autoFocus
                  defaultValue={displayName}
                  placeholder="配信者名など"
                />
                <p className="text-xs text-muted-foreground">
                  Googleアカウント名は使いません。参加中の部屋にも反映されます。
                </p>
              </div>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "保存中…" : "表示名を保存"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
