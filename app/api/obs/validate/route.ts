import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashObsToken, verifyObsToken } from "@/lib/obs/token";

const schema = z.object({
  roomId: z.string().uuid(),
  token: z.string().min(10),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "トークンが不正です。" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "サーバー設定が不足しています。" }, { status: 500 });
  }

  const tokenHash = hashObsToken(parsed.data.token);
  const { data: tokenRow } = await admin
    .from("obs_tokens")
    .select("id, room_id, token_hash, enabled")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (
    !tokenRow ||
    !tokenRow.enabled ||
    tokenRow.room_id !== parsed.data.roomId ||
    !verifyObsToken(parsed.data.token, tokenRow.token_hash)
  ) {
    return NextResponse.json(
      { error: "OBSトークンが無効か、再発行済みです。" },
      { status: 403 },
    );
  }

  const { data: room } = await admin
    .from("rooms")
    .select("id, name, master_volume, obs_volume, max_simultaneous_sounds")
    .eq("id", parsed.data.roomId)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "部屋が見つかりません。" }, { status: 404 });
  }

  const { data: sounds } = await admin
    .from("sounds")
    .select("id, name, audio_path, volume, cooldown_ms")
    .eq("room_id", parsed.data.roomId)
    .eq("approval_status", "approved")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  await admin
    .from("obs_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", tokenRow.id);

  // Short-lived cookie for subsequent signed-url / realtime bootstrap (httpOnly)
  const response = NextResponse.json({
    ok: true,
    room: {
      id: room.id,
      name: room.name,
      masterVolume: Number(room.master_volume),
      obsVolume: Number(room.obs_volume),
      maxSimultaneous: room.max_simultaneous_sounds,
    },
    sounds: sounds ?? [],
  });

  response.cookies.set({
    name: `obs_session_${parsed.data.roomId}`,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/`,
    maxAge: 60 * 60 * 12,
  });

  return response;
}
