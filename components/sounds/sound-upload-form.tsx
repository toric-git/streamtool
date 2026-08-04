"use client";

import { useState, useTransition } from "react";
import { createSound } from "@/app/actions/sounds";
import { readAudioDurationMs, previewAudioFile } from "@/lib/audio/browser-meta";
import { validateAudioFileMeta, validateImageFileMeta } from "@/lib/validation/schemas";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Category = { id: string; name: string };

export function SoundUploadForm({
  roomId,
  categories,
  canUpload,
}: {
  roomId: string;
  categories: Category[];
  canUpload: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [durationMs, setDurationMs] = useState<number | null>(null);

  if (!canUpload) {
    return <Alert>この部屋ではアップロードが許可されていません。</Alert>;
  }

  return (
    <form
      className="space-y-4 rounded-xl border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const audio = formData.get("audio");
        const image = formData.get("image");

        setError(null);
        setSuccess(null);

        startTransition(async () => {
          if (!(audio instanceof File) || audio.size === 0) {
            setError("音声ファイルを選択してください。");
            return;
          }

          let duration = durationMs;
          try {
            duration = duration ?? (await readAudioDurationMs(audio));
          } catch {
            setError("音声の再生時間を読み取れませんでした。別のファイルを試してください。");
            return;
          }

          const audioCheck = validateAudioFileMeta({
            filename: audio.name,
            mimeType: audio.type || "application/octet-stream",
            sizeBytes: audio.size,
            durationMs: duration,
          });
          if (!audioCheck.ok) {
            setError(audioCheck.message);
            return;
          }

          let imagePath: string | null = null;
          if (image instanceof File && image.size > 0) {
            const imageCheck = validateImageFileMeta({
              filename: image.name,
              mimeType: image.type || "application/octet-stream",
              sizeBytes: image.size,
            });
            if (!imageCheck.ok) {
              setError(imageCheck.message);
              return;
            }

            const imageUpload = await requestUploadUrl({
              roomId,
              kind: "image",
              file: image,
            });
            if (!imageUpload.ok) {
              setError(imageUpload.error);
              return;
            }
            const uploaded = await uploadWithToken(imageUpload, image);
            if (!uploaded.ok) {
              setError(uploaded.error);
              return;
            }
            imagePath = imageUpload.path;
          }

          const audioUpload = await requestUploadUrl({
            roomId,
            kind: "audio",
            file: audio,
            durationMs: duration,
          });
          if (!audioUpload.ok) {
            setError(audioUpload.error);
            return;
          }
          const uploadedAudio = await uploadWithToken(audioUpload, audio);
          if (!uploadedAudio.ok) {
            setError(uploadedAudio.error);
            return;
          }

          const result = await createSound({
            roomId,
            name: String(formData.get("name") || ""),
            audioPath: audioUpload.path,
            imagePath,
            categoryId: String(formData.get("categoryId") || "") || null,
            buttonColor: String(formData.get("buttonColor") || "#334155"),
            textColor: String(formData.get("textColor") || "#ffffff"),
            volume: Number(formData.get("volume") || 1),
            cooldownMs: Number(formData.get("cooldownMs") || 1000),
            durationMs: duration,
          });

          if (!result.ok) {
            setError(result.error);
            return;
          }

          setSuccess(
            "サウンドを登録しました。承認が必要な場合は、承認されるまでボードに表示されません。",
          );
          form.reset();
          setDurationMs(null);
        });
      }}
    >
      <h2 className="text-lg font-semibold">サウンドを追加</h2>
      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert>{success}</Alert>}

      <div className="space-y-2">
        <Label htmlFor="audio">音声ファイル (MP3/WAV/OGG, 10MB・30秒以下)</Label>
        <Input
          id="audio"
          name="audio"
          type="file"
          accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
          required
          onChange={async (e) => {
            const file = e.target.files?.[0];
            setDurationMs(null);
            if (!file) return;
            try {
              const ms = await readAudioDurationMs(file);
              setDurationMs(ms);
            } catch {
              setError("音声メタデータの読み取りに失敗しました。");
            }
          }}
        />
        {durationMs != null && (
          <p className="text-xs text-muted-foreground">
            再生時間: {(durationMs / 1000).toFixed(2)} 秒
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">ボタン名</Label>
        <Input id="name" name="name" required maxLength={40} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="buttonColor">ボタン色</Label>
          <Input id="buttonColor" name="buttonColor" type="color" defaultValue="#334155" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="textColor">文字色</Label>
          <Input id="textColor" name="textColor" type="color" defaultValue="#ffffff" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="volume">音量 (0-1)</Label>
          <Input
            id="volume"
            name="volume"
            type="number"
            min={0}
            max={1}
            step={0.05}
            defaultValue={1}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cooldownMs">クールダウン (ms)</Label>
          <Input id="cooldownMs" name="cooldownMs" type="number" min={0} defaultValue={1000} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">カテゴリー</Label>
        <select
          id="categoryId"
          name="categoryId"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          defaultValue=""
        >
          <option value="">なし</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">背景画像（任意）</Label>
        <Input id="image" name="image" type="file" accept=".jpg,.jpeg,.png,.webp,image/*" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "アップロード中…" : "登録"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            const input = document.getElementById("audio") as HTMLInputElement | null;
            const file = input?.files?.[0];
            if (!file) {
              setError("試聴する音声を選択してください。");
              return;
            }
            try {
              await previewAudioFile(file);
            } catch {
              setError("試聴に失敗しました。ブラウザの自動再生制限を確認してください。");
            }
          }}
        >
          試聴
        </Button>
      </div>
    </form>
  );
}

async function requestUploadUrl(options: {
  roomId: string;
  kind: "audio" | "image";
  file: File;
  durationMs?: number;
}): Promise<
  | { ok: true; path: string; token: string; signedUrl: string; bucket: string }
  | { ok: false; error: string }
> {
  const res = await fetch("/api/media/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roomId: options.roomId,
      kind: options.kind,
      filename: options.file.name,
      mimeType: options.file.type || "application/octet-stream",
      sizeBytes: options.file.size,
      durationMs: options.durationMs,
    }),
  });
  const data = (await res.json()) as {
    error?: string;
    path?: string;
    token?: string;
    signedUrl?: string;
    bucket?: string;
  };
  if (!res.ok || !data.path || !data.token || !data.signedUrl || !data.bucket) {
    return { ok: false, error: data.error ?? "アップロードURLの取得に失敗しました。" };
  }
  return {
    ok: true,
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
    bucket: data.bucket,
  };
}

async function uploadWithToken(
  upload: { path: string; token: string; signedUrl: string; bucket: string },
  file: File,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(upload.bucket)
    .uploadToSignedUrl(upload.path, upload.token, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

  if (error) {
    console.error("[upload] failed", error.name);
    return {
      ok: false,
      error: "ファイルのアップロードに失敗しました。容量と形式を確認して再試行してください。",
    };
  }
  return { ok: true };
}
