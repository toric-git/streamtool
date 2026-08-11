import { NextResponse } from "next/server";
import { z } from "zod";
import { SIGNED_URL_EXPIRES_IN, STORAGE_BUCKETS } from "@/lib/app-config";
import { requireRoomActor } from "@/lib/supabase/auth-context";

const bodySchema = z.object({
  roomId: z.string().uuid(),
  path: z.string().min(1).max(500),
  kind: z.enum(["audio", "image"]),
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

  const { roomId, path, kind } = parsed.data;

  if (!path.startsWith(`${roomId}/`)) {
    return NextResponse.json({ error: "パスが不正です。" }, { status: 400 });
  }

  const bucket = kind === "audio" ? STORAGE_BUCKETS.audio : STORAGE_BUCKETS.images;

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
