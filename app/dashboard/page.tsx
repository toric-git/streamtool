import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { isDevAuthBypassEnabled } from "@/lib/auth/dev-bypass";
import {
  getChosenDisplayName,
  needsDisplayNameSetup,
  PLACEHOLDER_DISPLAY_NAME,
} from "@/lib/auth/display-name";
import { createClient } from "@/lib/supabase/server";
import { AppLogo } from "@/components/brand/app-logo";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { UserSettingsPanel } from "@/components/auth/user-settings-panel";
import {
  DashboardRoomList,
  type DashboardRoomItem,
} from "@/components/rooms/dashboard-room-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RoomRole } from "@/types/database";

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

  const rooms: DashboardRoomItem[] = (memberships ?? [])
    .map((m) => {
      const room = Array.isArray(m.rooms) ? m.rooms[0] : m.rooms;
      if (!room) return null;
      return {
        id: room.id,
        name: room.name,
        room_code: room.room_code,
        description: room.description,
        role: m.role as RoomRole,
      };
    })
    .filter((r): r is DashboardRoomItem => r != null);

  return (
    <main className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,77,141,0.12),transparent_45%),linear-gradient(180deg,#fff7fb,#e8f7ff)]"
      />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
      {isDevAuthBypassEnabled() && (
        <p className="rounded-xl border border-amber-300/80 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950">
          開発用ログイン省略が有効です（DEV_AUTH_BYPASS）。本番では無効です。
        </p>
      )}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <AppLogo size="md" priority />
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              マイ部屋
            </h1>
            <p className="mt-0.5 truncate font-semibold text-muted-foreground">
              ようこそ、{welcomeName} さん。部屋を開いてすぐ押せます。
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <FeedbackButton />
          <UserSettingsPanel displayName={welcomeName} />
          <Button asChild className="font-bold shadow-none">
            <Link href="/rooms/new">部屋を作成</Link>
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
            所有・参加中の部屋一覧です。「保存して退出」した部屋はここに残ります。オーナーは削除、参加者は退出できます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!rooms.length ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              <p>まだ部屋がありません。</p>
              <Button asChild className="mt-4">
                <Link href="/rooms/new">最初の部屋を作成</Link>
              </Button>
            </div>
          ) : (
            <DashboardRoomList rooms={rooms} />
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
