export type SignedMediaKind = "audio" | "image";

export async function fetchSignedMediaUrl(options: {
  roomId: string;
  path: string;
  kind: SignedMediaKind;
  obsToken?: string;
}): Promise<{ ok: true; signedUrl: string } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/media/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: options.roomId,
        path: options.path,
        kind: options.kind,
        obsToken: options.obsToken,
      }),
    });
    const data = (await res.json()) as {
      signedUrl?: string;
      error?: string;
    };
    if (!res.ok || !data.signedUrl) {
      return {
        ok: false,
        error: data.error ?? "署名URLの発行に失敗しました。",
      };
    }
    return { ok: true, signedUrl: data.signedUrl };
  } catch {
    return { ok: false, error: "署名URLの取得に失敗しました。" };
  }
}
