import { JoinRoomForm } from "@/components/rooms/join-room-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getChosenDisplayName,
  PLACEHOLDER_DISPLAY_NAME,
} from "@/lib/auth/display-name";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ roomCode: string }> };

export default async function JoinPage({ params }: Props) {
  const { roomCode: raw } = await params;
  const roomCode = raw.toUpperCase();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: infoRows } = await supabase.rpc("get_room_join_info", {
    p_room_code: roomCode,
  });
  const info = Array.isArray(infoRows) ? infoRows[0] : infoRows;

  let suggestedDisplayName = getChosenDisplayName(user) ?? "";
  if (!suggestedDisplayName && user && !user.is_anonymous) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    if (
      profile?.display_name &&
      profile.display_name !== PLACEHOLDER_DISPLAY_NAME
    ) {
      suggestedDisplayName = profile.display_name;
    }
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-teal-50 to-slate-200 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>部屋に参加</CardTitle>
          <CardDescription>
            コード{" "}
            <span className="font-mono font-medium text-foreground">
              {roomCode}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JoinRoomForm
            roomCode={roomCode}
            info={info ?? null}
            isAuthenticated={Boolean(user)}
            isAnonymous={Boolean(user?.is_anonymous)}
            suggestedDisplayName={suggestedDisplayName}
          />
        </CardContent>
      </Card>
    </main>
  );
}
