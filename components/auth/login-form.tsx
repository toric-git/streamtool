"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  signInWithEmail,
  signUpWithEmail,
  type AuthActionState,
} from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Button } from "@/components/ui/button";
import { E, type AppError } from "@/lib/errors/catalog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = { error: null, code: null };

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const oauthError = searchParams.get("error") === "oauth";
  const oauthDetail = searchParams.get("detail");
  const initialMode =
    searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<AppError | null>(null);

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
      const safeNext = next.startsWith("/") ? next : "/dashboard";
      document.cookie = `auth_next=${encodeURIComponent(safeNext)}; path=/; max-age=600; samesite=lax`;

      const supabase = createClient();
      // Keep redirectTo free of query params so Supabase allow-list matches reliably.
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        console.error(
          "[auth]",
          E.AUTH_GOOGLE_FAILED.code,
          error.name,
          error.message,
        );
        setGoogleError({
          ...E.AUTH_GOOGLE_FAILED,
          message:
            "Googleログインを開始できませんでした。Supabase で Google プロバイダと Client ID / Secret を確認してください。",
        });
        setGoogleLoading(false);
        return;
      }
      if (!data?.url) {
        setGoogleError({
          ...E.AUTH_PROVIDER_DISABLED,
          message:
            "Googleログイン用のURLを取得できませんでした。Providers 設定を確認してください。",
        });
        setGoogleLoading(false);
        return;
      }
      window.location.assign(data.url);
    } catch (err) {
      console.error("[auth]", E.AUTH_GOOGLE_FAILED.code, err);
      setGoogleError({
        ...E.AUTH_GOOGLE_FAILED,
        message:
          "Googleログインに失敗しました。Norton の HTTPS スキャンや Google 設定を確認してください。",
      });
      setGoogleLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-slate-200/80 bg-white/90 shadow-lg backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl">
          {mode === "login" ? "ログイン" : "新規登録"}
        </CardTitle>
        <CardDescription>
          {mode === "login"
            ? "メールまたは Google でログインできます"
            : "はじめての方はこちら。表示名を決めてアカウントを作成します"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(state.error || googleError || oauthError) && (
          <ErrorAlert
            error={
              state.error && state.code
                ? { code: state.code, message: state.error }
                : googleError
                  ? googleError
                  : {
                      ...E.AUTH_OAUTH_FAILED,
                      message:
                        oauthDetail || E.AUTH_OAUTH_FAILED.message,
                    }
            }
          />
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
                placeholder="配信で使う名前"
              />
              <p className="text-xs text-muted-foreground">
                部屋や参加者一覧に表示されます。Googleアカウント名は使いません。
              </p>
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
          {mode === "signup" && (
            <p className="text-center text-xs font-semibold leading-relaxed text-muted-foreground">
              登録をもって
              <Link href="/terms" className="underline-offset-2 hover:underline">
                利用規約
              </Link>
              および
              <Link
                href="/privacy"
                className="underline-offset-2 hover:underline"
              >
                プライバシーポリシー
              </Link>
              に同意したものとみなします。
            </p>
          )}
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
