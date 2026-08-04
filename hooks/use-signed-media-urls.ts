"use client";

import { useEffect, useState } from "react";
import { fetchSignedMediaUrl } from "@/lib/media/signed-url-client";

type Options = {
  roomId: string;
  paths: Array<string | null | undefined>;
  kind: "audio" | "image";
  enabled?: boolean;
};

/** Resolve private Storage paths to short-lived signed URLs. */
export function useSignedMediaUrls({
  roomId,
  paths,
  kind,
  enabled = true,
}: Options) {
  const [urls, setUrls] = useState<Record<string, string>>({});

  const pathKey = paths
    .filter((p): p is string => Boolean(p))
    .sort()
    .join("|");

  useEffect(() => {
    if (!enabled || !roomId || !pathKey) {
      return;
    }

    const unique = [...new Set(pathKey.split("|"))];
    let cancelled = false;

    void (async () => {
      const entries = await Promise.all(
        unique.map(async (path) => {
          const result = await fetchSignedMediaUrl({ roomId, path, kind });
          if (!result.ok) {
            console.error("[media] signed url failed", kind);
            return [path, null] as const;
          }
          return [path, result.signedUrl] as const;
        }),
      );

      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const [path, url] of entries) {
        if (url) next[path] = url;
      }
      setUrls(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [roomId, pathKey, kind, enabled]);

  return urls;
}
