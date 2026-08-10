import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import {
  getChosenDisplayName,
  needsDisplayNameSetup,
  PLACEHOLDER_DISPLAY_NAME,
} from "@/lib/auth/display-name";
import { APP_NAME } from "@/lib/app-config";
import { createClient } from "@/lib/supabase/server";
import { UserSettingsPanel } from "@/components/auth/user-settings-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  if (needsDisplayNameSetup(user)) {
    redirect("/onboarding/name?next=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const welcomeName =
    getChosenDisplayName(user) ??
    (profile?.display_name && profile.display_name !== PLACEHOLDER_DISPLAY_NAME
      ? profile.display_name
      : null) ??
    "ユーザー";

  const { data: memberships, error } = await supabase
    .from("room_members")
    .select(
      "role, rooms ( id, name, room_code, description, updated_at )",
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  if (error) {
    console.error("[dashboard] list rooms failed", error.code);
  }

  return (
    <main className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,77,141,0.12),transparent_45%),linear-gradient(180deg,#fff7fb,#e8f7ff)]"
      />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-primary">
            <Link href="/" className="hover:underline">
              {APP_NAME}
            </Link>
            {" · "}
            <Link href="/tools/soundboard" className="hover:underline">
              サウンドボード
            </Link>
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            マイ部屋
          </h1>
          <p className="mt-1 font-semibold text-muted-foreground">
            ようこそ、{welcomeName} さん。部屋を開いてすぐ押せます。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <UserSettingsPanel displayName={welcomeName} />
          <Button asChild className="font-bold shadow-none">
            <Link href="/rooms/new">部屋を作成</Link>
          </Button>
          <Button asChild variant="secondary" className="font-bold shadow-none">
            <Link href="/">ハブへ</Link>
          </Button>
          <form action={signOut}>
            <Button type="submit" variant="outline" className="font-bold">
              ログアウト
            </Button>
          </form>
        </div>
      </header>

      <Card className="border-border/80 bg-white/90">
        <CardHeader>
          <CardTitle className="font-display">あなたの部屋</CardTitle>
          <CardDescription className="font-semibold">
            所有・参加中の部屋一覧です。招待コードは各部屋の「招待」から共有できます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!memberships?.length ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              <p>まだ部屋がありません。</p>
              <Button asChild className="mt-4">
                <Link href="/rooms/new">最初の部屋を作成</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y rounded-xl border">
              {memberships.map((m) => {
                const room = Array.isArray(m.rooms) ? m.rooms[0] : m.rooms;
                if (!room) return null;
                return (
                  <li
                    key={room.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{room.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.role} · コード {room.room_code}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/rooms/${room.id}`}>開く</Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="pt-2">
            <p className="mb-2 text-sm text-muted-foreground">招待コードで参加</p>
            <JoinByCode />
          </div>
        </CardContent>
      </Card>
      </div>
    </main>
  );
}

function JoinByCode() {
  return (
    <form
      className="flex flex-wrap gap-2"
      action={async (formData) => {
        "use server";
        const code = String(formData.get("code") || "")
          .trim()
          .toUpperCase();
        if (!code) return;
        redirect(`/join/${code}`);
      }}
    >
      <input
        name="code"
        maxLength={8}
        placeholder="ルームコード"
        className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
        aria-label="ルームコード"
      />
      <Button type="submit" variant="secondary">
        参加画面へ
      </Button>
    </form>
  );
}
