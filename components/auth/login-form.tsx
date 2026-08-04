"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  signInWithEmail,
  signUpWithEmail,
  type AuthActionState,
} from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/app-config";
import { Alert } from "@/components/ui/alert";
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

const initialState: AuthActionState = { error: null };

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const oauthError = searchParams.get("error") === "oauth";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const [loginState, loginAction, loginPending] = useActionState(
    signInWithEmail,
    initialState,
  );
  const [signupState, signupAction, signupPending] = useActionState(
    signUpWithEmail,
    initialState,
  );

  const state = mode === "login" ? loginState : signupState;
  const pending = mode === "login" ? loginPending : signupPending;

  async function handleGoogle() {
    setGoogleError(null);
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) {
        console.error("[auth] google oauth start failed", error.name);
        setGoogleError(
          "Googleログインを開始できませんでした。SupabaseでGoogleプロバイダが有効か確認してください。",
        );
        setGoogleLoading(false);
      }
    } catch (err) {
      console.error("[auth] google oauth unexpected", err);
      setGoogleError("Googleログインに失敗しました。しばらくしてから再度お試しください。");
      setGoogleLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-slate-200/80 bg-white/90 shadow-lg backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl">{APP_NAME}</CardTitle>
        <CardDescription>
          {mode === "login"
            ? "メールまたは Google でログイン"
            : "新規アカウントを作成"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(state.error || googleError || oauthError) && (
          <Alert variant="destructive">
            {state.error ||
              googleError ||
              "外部ログインに失敗しました。もう一度お試しください。"}
          </Alert>
        )}
        {state.success && <Alert>{state.success}</Alert>}

        <form
          action={mode === "login" ? loginAction : signupAction}
          className="space-y-4"
        >
          <input type="hidden" name="next" value={next} />
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="displayName">表示名</Label>
              <Input
                id="displayName"
                name="displayName"
                autoComplete="nickname"
                required
                maxLength={30}
                placeholder="配信者名など"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
              placeholder="8文字以上"
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? "処理中…"
              : mode === "login"
                ? "ログイン"
                : "アカウント作成"}
          </Button>
        </form>

        <div className="relative py-2 text-center text-xs text-muted-foreground">
          <span className="bg-card px-2 relative z-10">または</span>
          <div className="absolute inset-x-0 top-1/2 border-t" aria-hidden />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          disabled={googleLoading}
        >
          {googleLoading ? "リダイレクト中…" : "Googleで続行"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              アカウント未作成の方は{" "}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => setMode("signup")}
              >
                新規登録
              </button>
            </>
          ) : (
            <>
              すでにアカウントがある方は{" "}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => setMode("login")}
              >
                ログイン
              </button>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
