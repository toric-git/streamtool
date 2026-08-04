import { NextResponse } from "next/server";
import { z } from "zod";
import { SIGNED_URL_EXPIRES_IN, STORAGE_BUCKETS } from "@/lib/app-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoomActor } from "@/lib/supabase/auth-context";
import { hashObsToken, verifyObsToken } from "@/lib/obs/token";

const bodySchema = z.object({
  roomId: z.string().uuid(),
  path: z.string().min(1).max(500),
  kind: z.enum(["audio", "image"]),
  obsToken: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力が不正です。" }, { status: 400 });
  }

  const { roomId, path, kind, obsToken } = parsed.data;

  if (!path.startsWith(`${roomId}/`)) {
    return NextResponse.json({ error: "パスが不正です。" }, { status: 400 });
  }

  const bucket = kind === "audio" ? STORAGE_BUCKETS.audio : STORAGE_BUCKETS.images;

  if (obsToken) {
    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return NextResponse.json({ error: "サーバー設定が不足しています。" }, { status: 500 });
    }

    const tokenHash = hashObsToken(obsToken);
    const { data: tokenRow } = await admin
      .from("obs_tokens")
      .select("id, room_id, token_hash, enabled")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (
      !tokenRow ||
      !tokenRow.enabled ||
      tokenRow.room_id !== roomId ||
      !verifyObsToken(obsToken, tokenRow.token_hash)
    ) {
      return NextResponse.json({ error: "OBSトークンが無効です。" }, { status: 403 });
    }

    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUrl(path, SIGNED_URL_EXPIRES_IN);

    if (error || !data) {
      console.error("[media] obs signed url failed", error?.name);
      return NextResponse.json({ error: "音声URLの発行に失敗しました。" }, { status: 500 });
    }

    await admin
      .from("obs_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", tokenRow.id);

    return NextResponse.json({ signedUrl: data.signedUrl, expiresIn: SIGNED_URL_EXPIRES_IN });
  }

  const actor = await requireRoomActor(roomId);
  if (!actor.ok) {
    return NextResponse.json(
      { error: actor.error },
      { status: actor.user ? 403 : 401 },
    );
  }
  const { supabase } = actor;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_EXPIRES_IN);

  if (error || !data) {
    console.error("[media] signed url failed", error?.name);
    return NextResponse.json(
      { error: "署名URLの発行に失敗しました。再試行してください。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ signedUrl: data.signedUrl, expiresIn: SIGNED_URL_EXPIRES_IN });
}
