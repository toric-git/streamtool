import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SIGNED_URL_EXPIRES_IN,
  STORAGE_BUCKETS,
} from "@/lib/app-config";
import { requireRoomActor } from "@/lib/supabase/auth-context";
import {
  getExtension,
  validateAudioFileMeta,
  validateImageFileMeta,
} from "@/lib/validation/schemas";

const bodySchema = z.object({
  roomId: z.string().uuid(),
  kind: z.enum(["audio", "image"]),
  filename: z.string().min(1).max(200),
  mimeType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive(),
  durationMs: z.number().int().positive().optional(),
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力が不正です" },
      { status: 400 },
    );
  }

  const { roomId, kind, filename, mimeType, sizeBytes, durationMs } = parsed.data;

  const actor = await requireRoomActor(roomId);
  if (!actor.ok) {
    return NextResponse.json(
      { error: actor.error },
      { status: actor.user ? 403 : 401 },
    );
  }

  const { supabase, membership, user } = actor;

  const { data: room } = await supabase
    .from("rooms")
    .select("upload_enabled")
    .eq("id", roomId)
    .maybeSingle();

  const isAdmin = membership.role === "owner" || membership.role === "admin";
  if (!isAdmin) {
    if (!room?.upload_enabled || !membership.can_upload) {
      return NextResponse.json(
        { error: "この部屋ではアップロードが許可されていません。" },
        { status: 403 },
      );
    }
  }

  if (kind === "audio") {
    const v = validateAudioFileMeta({
      filename,
      mimeType,
      sizeBytes,
      durationMs: durationMs ?? null,
    });
    if (!v.ok) {
      return NextResponse.json({ error: v.message }, { status: 400 });
    }
  } else {
    const v = validateImageFileMeta({ filename, mimeType, sizeBytes });
    if (!v.ok) {
      return NextResponse.json({ error: v.message }, { status: 400 });
    }
  }

  const ext = getExtension(filename) || (kind === "audio" ? "mp3" : "png");
  const path = `${roomId}/${user.id}/${randomUUID()}.${ext}`;
  const bucket = kind === "audio" ? STORAGE_BUCKETS.audio : STORAGE_BUCKETS.images;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[media] signed upload url failed", error?.name);
    return NextResponse.json(
      { error: "アップロード用URLの発行に失敗しました。再試行してください。" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    bucket,
    path,
    token: data.token,
    signedUrl: data.signedUrl,
    expiresIn: SIGNED_URL_EXPIRES_IN,
  });
}
