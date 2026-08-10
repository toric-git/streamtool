import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDevAuthBypassEnabled } from "@/lib/auth/dev-bypass";
import { ensureDevAuthSession } from "@/lib/auth/dev-auth-session";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // IMPORTANT: Do not add logic between createServerClient and getUser().
  const {
    data: { user: initialUser },
  } = await supabase.auth.getUser();

  let user = initialUser;

  if (!user && isDevAuthBypassEnabled(request)) {
    user = await ensureDevAuthSession(supabase);
    if (user) {
      console.info("[dev-auth] auto-login active for", user.email ?? user.id);
    }
  }

  const pathname = request.nextUrl.pathname;
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/rooms") ||
    pathname.startsWith("/admin");
  const isAuthPage = pathname.startsWith("/login");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (isDevAuthBypassEnabled(request)) {
    supabaseResponse.headers.set("x-dev-auth-bypass", "1");
  }

  return supabaseResponse;
}
