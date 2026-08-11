export async function fetchSignedMediaUrl(options: {
  roomId: string;
  path: string;
  kind: "audio" | "image";
}): Promise<{ ok: true; signedUrl: string } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/media/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: options.roomId,
        path: options.path,
        kind: options.kind,
      }),
    });
    const data = (await res.json()) as { signedUrl?: string; error?: string };
    if (!res.ok || !data.signedUrl) {
      return { ok: false, error: data.error ?? "signed url failed" };
    }
    return { ok: true, signedUrl: data.signedUrl };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "signed url failed",
    };
  }
}
