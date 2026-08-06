import { NextResponse } from "next/server";
import { z } from "zod";
import { E } from "@/lib/errors/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hashObsToken, verifyObsToken } from "@/lib/obs/token";
import { OBS_DISPLAY_NAME } from "@/lib/rooms/members";

const schema = z.object({
  roomId: z.string().uuid(),
  token: z.string().min(10),
});

/**
 * After OBS token validation + anonymous sign-in on the client,
 * ensure the OBS anonymous user is a room member so Realtime RLS works.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: E.AUTH_REQUIRED.message, code: E.AUTH_REQUIRED.code },
      { status: 401 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: E.VALIDATION.message, code: E.VALIDATION.code },
      { status: 400 },
    );
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: E.VALIDATION.message, code: E.VALIDATION.code },
      { status: 400 },
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: E.OBS_CONFIG_MISSING.message, code: E.OBS_CONFIG_MISSING.code },
      { status: 500 },
    );
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
      { error: E.OBS_VALIDATE_FAILED.message, code: E.OBS_VALIDATE_FAILED.code },
      { status: 403 },
    );
  }

  const { data: existing } = await admin
    .from("room_members")
    .select("user_id")
    .eq("room_id", parsed.data.roomId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error } = await admin.from("room_members").insert({
      room_id: parsed.data.roomId,
      user_id: user.id,
      display_name: OBS_DISPLAY_NAME,
      role: "guest",
      can_play: false,
      can_upload: false,
      is_muted: true,
    });
    if (error) {
      console.error(
        "[obs]",
        E.OBS_SESSION_FAILED.code,
        error.code,
        error.message,
      );
      return NextResponse.json(
        {
          error: E.OBS_SESSION_FAILED.message,
          code: E.OBS_SESSION_FAILED.code,
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}
