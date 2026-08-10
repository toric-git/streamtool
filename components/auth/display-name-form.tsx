"use client";

import { useState, useTransition } from "react";
import { updateDisplayNameAction } from "@/app/actions/profile";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppError } from "@/lib/errors/catalog";

export function DisplayNameForm({
  next,
  initialName = "",
}: {
  next: string;
  initialName?: string;
}) {
  const [error, setError] = useState<AppError | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card className="w-full max-w-md border-slate-200/80 bg-white/90 shadow-lg backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl">表示名を決めよう</CardTitle>
        <CardDescription>
          配信や部屋で表示される名前です。Googleアカウント名は使いません。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            formData.set("next", next);
            setError(null);
            startTransition(async () => {
              const result = await updateDisplayNameAction(formData);
              if (result && "ok" in result && !result.ok) {
                setError({ code: result.code, message: result.error });
              }
            });
          }}
        >
          {error && <ErrorAlert error={error} />}
          <div className="space-y-2">
            <Label htmlFor="displayName">表示名</Label>
            <Input
              id="displayName"
              name="displayName"
              required
              maxLength={30}
              autoComplete="nickname"
              autoFocus
              defaultValue={initialName}
              placeholder="配信者名など"
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "保存中…" : "この名前で続ける"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
