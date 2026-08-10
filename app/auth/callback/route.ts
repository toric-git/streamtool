import { NextResponse } from "next/server";
import { needsDisplayNameSetup } from "@/lib/auth/display-name";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthDescription = searchParams.get("error_description");
  const nextParam = searchParams.get("next");

  const requestCookies = request.headers.get("cookie") ?? "";
  const nextFromCookie = requestCookies
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("auth_next="))
    ?.slice("auth_next=".length);

  let next = "/dashboard";
  try {
    const decoded = decodeURIComponent(nextFromCookie || nextParam || "/dashboard");
    if (decoded.startsWith("/")) next = decoded;
  } catch {
    next = "/dashboard";
  }

  if (oauthError) {
    console.error("[auth] oauth provider error", oauthError, oauthDescription);
    const url = new URL("/login", origin);
    url.searchParams.set("error", "oauth");
    if (oauthDescription) {
      url.searchParams.set("detail", oauthDescription.slice(0, 180));
    }
    const response = NextResponse.redirect(url);
    response.cookies.set("auth_next", "", { path: "/", maxAge: 0 });
    return response;
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let destination = next;
      if (needsDisplayNameSetup(user)) {
        const onboarding = new URL("/onboarding/name", origin);
        onboarding.searchParams.set("next", next);
        destination = `${onboarding.pathname}${onboarding.search}`;
      }

      const response = NextResponse.redirect(`${origin}${destination}`);
      response.cookies.set("auth_next", "", { path: "/", maxAge: 0 });
      return response;
    }
    console.error(
      "[auth] callback exchange failed",
      error.name,
      error.message,
      error.code,
    );
    const url = new URL("/login", origin);
    url.searchParams.set("error", "oauth");
    url.searchParams.set(
      "detail",
      "セッションの確立に失敗しました。もう一度お試しください。",
    );
    const response = NextResponse.redirect(url);
    response.cookies.set("auth_next", "", { path: "/", maxAge: 0 });
    return response;
  }

  const url = new URL("/login", origin);
  url.searchParams.set("error", "oauth");
  url.searchParams.set(
    "detail",
    "認証コードがありません。Google のリダイレクト URI が Supabase 用になっているか確認してください。",
  );
  return NextResponse.redirect(url);
}
